// ──────────────────────────────────────────────────────────────────────────
// Backend Kessoku : authentification (comptes en SQLite) + synchro collaborative.
// Le serveur est AUTORITAIRE : il stocke les données du festival (par room) en
// base et les sert aux clients authentifiés. La synchro temps réel exige un token.
// ──────────────────────────────────────────────────────────────────────────

import express from 'express'
import http from 'node:http'
import { WebSocketServer } from 'ws'
import {
  seedAdmin, getUserByUsername, getUserById, listUsers, createUser, deleteUser,
  countAdmins, setPassword, verifyPassword, getWorkspace, saveWorkspace,
  setEventAccess, grantEventAccess, setRole,
} from './db.mjs'
import { signToken, verifyToken } from './auth.mjs'
import { applyOpsToEvents } from './sync.mjs'

const PORT = process.env.PORT ? Number(process.env.PORT) : 1234

// Filet de sécurité : ne jamais laisser une exception isolée tuer tout le backend.
process.on('uncaughtException', (e) => console.error('[kessoku] uncaughtException :', e))
process.on('unhandledRejection', (e) => console.error('[kessoku] unhandledRejection :', e))

// ── Démarrage : admin initial ────────────────────────────────────────────────
const seeded = seedAdmin()
if (seeded) {
  console.log(`[kessoku] Compte admin créé : « ${seeded.username} »`)
  if (seeded.generated) console.log(`[kessoku] Mot de passe généré : ${seeded.password}  (note-le !)`)
}

// ── API HTTP ─────────────────────────────────────────────────────────────────
const app = express()
app.set('trust proxy', 1) // un seul hop : nginx (réseau Docker) -> req.ip = client réel
app.use(express.json({ limit: '2mb' }))

// Authentifie ET re-valide en base : un compte supprimé ou dont le mot de passe a
// changé (token_version incrémentée) est rejeté immédiatement, sans attendre l'expiration.
function authMiddleware(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  const claims = token ? verifyToken(token) : null
  const u = claims && getUserById(claims.id)
  if (!u || u.token_version !== claims.tv) return res.status(401).json({ error: 'Non authentifié.' })
  req.user = { id: u.id, username: u.username, role: u.role }
  next()
}
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Réservé à l’administrateur.' })
  next()
}

// Périmètre d'accès d'un utilisateur : null = tous les événements (admin ou '*'),
// sinon un Set d'ids d'événements autorisés.
function accessSet(user) {
  if (!user || user.role === 'admin' || user.event_access === '*') return null
  try {
    const arr = JSON.parse(user.event_access)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}
function filterEvents(events, allowed) {
  return allowed ? events.filter((e) => allowed.has(e.id)) : events
}
function filterOps(ops, allowed) {
  return allowed ? ops.filter((op) => op && typeof op === 'object' && allowed.has(op.eventId)) : ops
}

// Limiteur anti-bruteforce : par IP (backstop) ET par identifiant ciblé.
const attempts = new Map()
function bump(key, max) {
  const now = Date.now()
  const rec = attempts.get(key) || { n: 0, t: now }
  if (now - rec.t > 60_000) { rec.n = 0; rec.t = now }
  rec.n++
  attempts.set(key, rec)
  return rec.n <= max
}
function loginThrottle(req, res, next) {
  const ip = req.ip || 'x'
  const user = String((req.body || {}).username || '').toLowerCase().slice(0, 64)
  const okIp = bump(`ip:${ip}`, 30)
  const okUser = bump(`u:${user}`, 8)
  if (!okIp || !okUser) {
    return res.status(429).json({ error: 'Trop de tentatives, réessaie dans une minute.' })
  }
  next()
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Prochain événement à venir (pour le bot Discord). Protégé par SERVICE_TOKEN ;
// désactivé tant que ce secret n'est pas défini (aucune fuite par défaut).
app.get('/api/next-event', (req, res) => {
  const expected = process.env.SERVICE_TOKEN
  if (!expected) return res.status(503).json({ error: 'Endpoint désactivé.' })
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (token !== expected) return res.status(401).json({ error: 'Non autorisé.' })

  const root = getRoot('main')
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = root.events
    .map((e) => e.data && e.data.festival)
    .filter((f) => f && f.date && f.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const next = upcoming[0]
  if (!next) return res.status(404).json({ error: 'Aucun événement à venir.' })
  res.json({ name: next.name, date: next.date, kind: next.kind })
})

app.post('/api/login', loginThrottle, (req, res) => {
  const { username, password } = req.body || {}
  const user = username && getUserByUsername(String(username).trim())
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants invalides.' })
  }
  res.json({ token: signToken(user), user: { id: user.id, username: user.username, role: user.role } })
})

app.get('/api/me', authMiddleware, (req, res) => {
  const u = getUserById(req.user.id)
  if (!u) return res.status(401).json({ error: 'Compte introuvable.' })
  res.json({ user: { id: u.id, username: u.username, role: u.role } })
})

app.post('/api/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  const u = getUserById(req.user.id)
  if (!u || !verifyPassword(String(currentPassword || ''), u.password_hash)) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect.' })
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères.' })
  }
  setPassword(u.id, String(newPassword))
  res.json({ ok: true })
})

app.get('/api/users', authMiddleware, adminOnly, (_req, res) => {
  res.json({ users: listUsers() })
})

app.post('/api/users', authMiddleware, adminOnly, (req, res) => {
  const username = String((req.body || {}).username || '').trim()
  const password = String((req.body || {}).password || '')
  const role = (req.body || {}).role === 'admin' ? 'admin' : 'member'
  if (!username || password.length < 6) {
    return res.status(400).json({ error: 'Nom requis et mot de passe d’au moins 6 caractères.' })
  }
  if (getUserByUsername(username)) return res.status(409).json({ error: 'Ce nom est déjà pris.' })
  const eventAccess = (req.body || {}).eventAccess // '*' ou tableau d'ids
  const user = createUser(username, password, role, eventAccess)
  res.status(201).json({ user })
})

// Modifier le rôle et/ou le périmètre d'accès d'un compte (admin).
app.patch('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id)
  const target = getUserById(id)
  if (!target) return res.status(404).json({ error: 'Introuvable.' })
  const body = req.body || {}
  // Réinitialisation du mot de passe par l'admin (révoque les sessions existantes
  // via token_version incrémenté dans setPassword).
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe d’au moins 6 caractères.' })
    }
    setPassword(id, body.password)
  }
  if (body.role === 'admin' || body.role === 'member') {
    if (target.role === 'admin' && body.role !== 'admin' && countAdmins() <= 1) {
      return res.status(400).json({ error: 'Impossible de rétrograder le dernier administrateur.' })
    }
    setRole(id, body.role)
  }
  if (body.eventAccess !== undefined) setEventAccess(id, body.eventAccess)
  closeUserSockets(id) // applique périmètre/révocation immédiatement (le client se reconnecte/déconnecte)
  res.json({ ok: true })
})

app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id)
  const target = getUserById(id)
  if (!target) return res.status(404).json({ error: 'Introuvable.' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'Tu ne peux pas te supprimer toi-même.' })
  if (target.role === 'admin' && countAdmins() <= 1) {
    return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur.' })
  }
  deleteUser(id)
  closeUserSockets(id) // coupe immédiatement ses sessions temps réel ouvertes
  res.json({ ok: true })
})

// ── WebSocket : synchro temps réel (autoritaire + persistante) ───────────────
const server = http.createServer(app)
const wss = new WebSocketServer({ noServer: true })

// Document canonique par room (en mémoire, chargé depuis la base à la demande).
const roots = new Map()
const persistTimers = new Map()

function getRoot(room) {
  if (!roots.has(room)) {
    const stored = getWorkspace(room)
    roots.set(room, stored && Array.isArray(stored.events) ? stored : { events: [] })
  }
  return roots.get(room)
}
function schedulePersist(room) {
  if (persistTimers.has(room)) clearTimeout(persistTimers.get(room))
  persistTimers.set(
    room,
    setTimeout(() => {
      persistTimers.delete(room)
      saveWorkspace(room, getRoot(room))
    }, 800),
  )
}

server.on('upgrade', (req, socket, head) => {
  let url
  try {
    url = new URL(req.url, 'http://localhost')
  } catch {
    socket.destroy()
    return
  }
  if (url.pathname !== '/sync') {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    socket.destroy()
    return
  }
  const claims = verifyToken(url.searchParams.get('token') || '')
  const u = claims && getUserById(claims.id)
  if (!u || u.token_version !== claims.tv) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    // Identité/rôle/accès réconciliés depuis la base, pas depuis le token.
    ws.user = { id: u.id, username: u.username, role: u.role, event_access: u.event_access }
    ws.allowed = accessSet(ws.user) // null = tout ; sinon Set d'ids autorisés
    wss.emit('connection', ws, req)
  })
})

// room -> Map(clientId -> { ws, name })
const rooms = new Map()
let counter = 0

function broadcastPresence(room) {
  const clients = rooms.get(room)
  if (!clients) return
  const users = [...clients.values()].map((c) => ({ id: c.id, name: c.name }))
  const payload = JSON.stringify({ t: 'presence', users })
  for (const c of clients.values()) safeSend(c.ws, payload)
}
function safeSend(ws, data) {
  try {
    if (ws.readyState === ws.OPEN) ws.send(data)
  } catch {
    /* ignore */
  }
}
// Ferme toutes les sessions WS d'un utilisateur (ex. après suppression du compte).
function closeUserSockets(userId) {
  for (const clients of rooms.values()) {
    for (const c of clients.values()) {
      if (c.ws.user && c.ws.user.id === userId) {
        try {
          c.ws.close(4401, 'compte révoqué')
        } catch {
          /* ignore */
        }
      }
    }
  }
}

wss.on('connection', (ws) => {
  const id = `c${++counter}`
  let room = null

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.t === 'join') {
      room = String(msg.room || 'main').trim() || 'main'
      if (!rooms.has(room)) rooms.set(room, new Map())
      rooms.get(room).set(id, { id, ws, name: ws.user.username })
      broadcastPresence(room)
      const root = getRoot(room)
      const events = filterEvents(root.events, ws.allowed)
      // Seul un compte « tout accès » amorce un serveur vierge (un compte restreint ne pousse jamais tout).
      const canSeed = root.events.length === 0 && ws.allowed === null
      safeSend(ws, JSON.stringify({ t: 'snapshot', root: { events }, empty: canSeed }))
      return
    }

    if (!room) return

    if (msg.t === 'ops' && Array.isArray(msg.ops)) {
      try {
        const root = getRoot(room)
        // Auto-accès : un compte restreint qui CRÉE un nouvel événement en garde l'accès
        // (mais ne peut pas s'octroyer l'accès à un événement EXISTANT).
        if (ws.allowed) {
          for (const op of msg.ops) {
            if (
              op && op.coll === 'event' && op.kind === 'upsert' &&
              typeof op.eventId === 'string' &&
              !ws.allowed.has(op.eventId) &&
              !root.events.some((e) => e.id === op.eventId)
            ) {
              ws.allowed.add(op.eventId)
              grantEventAccess(ws.user.id, op.eventId)
            }
          }
        }
        // N'applique que les ops autorisées pour cet utilisateur.
        const incoming = filterOps(msg.ops, ws.allowed)
        if (incoming.length === 0) return
        root.events = applyOpsToEvents(root.events, incoming)
        schedulePersist(room)
        // Diffuse à chaque autre client UNIQUEMENT ce qu'il a le droit de voir.
        const clients = rooms.get(room)
        if (clients) {
          for (const [cid, c] of clients) {
            if (cid === id) continue
            const visible = filterOps(incoming, c.ws.allowed)
            if (visible.length) safeSend(c.ws, JSON.stringify({ t: 'ops', ops: visible }))
          }
        }
      } catch (e) {
        console.error('[kessoku] op rejetée :', e?.message || e)
      }
    }
  })

  ws.on('close', () => {
    if (room && rooms.has(room)) {
      rooms.get(room).delete(id)
      if (rooms.get(room).size === 0) rooms.delete(room)
      else broadcastPresence(room)
    }
  })
  ws.on('error', () => {})
})

server.listen(PORT, () => {
  console.log(`[kessoku] backend (API + synchro) à l'écoute sur le port ${PORT}`)
})
