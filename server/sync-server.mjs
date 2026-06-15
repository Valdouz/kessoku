// ──────────────────────────────────────────────────────────────────────────
// Serveur de synchronisation Kessoku — RELAIS PUR (n'interprète pas les données).
// Rôle : relayer les ops entre les membres d'une même room, gérer la présence,
// et faire transiter un snapshot complet d'un pair vers un nouvel arrivant.
// Aucune donnée n'est persistée ici : tout vit dans les navigateurs (local-first).
//
// Lancer :  node server/sync-server.mjs      (ou  npm run sync)
// Port    :  variable d'env PORT (défaut 1234)
// ──────────────────────────────────────────────────────────────────────────

import { WebSocketServer } from 'ws'

const PORT = process.env.PORT ? Number(process.env.PORT) : 1234
const wss = new WebSocketServer({ port: PORT })

/** room -> Map(clientId -> { socket, name }) */
const rooms = new Map()
let counter = 0

function safeSend(socket, data) {
  try {
    if (socket.readyState === socket.OPEN) socket.send(data)
  } catch {
    /* socket fermé */
  }
}

function broadcastPresence(room) {
  const clients = rooms.get(room)
  if (!clients) return
  const users = [...clients.entries()].map(([id, c]) => ({ id, name: c.name }))
  const payload = JSON.stringify({ t: 'presence', users })
  for (const c of clients.values()) safeSend(c.socket, payload)
}

wss.on('connection', (socket) => {
  const id = `c${++counter}`
  let room = null

  socket.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.t === 'join') {
      room = String(msg.room || '').trim()
      if (!room) return
      if (!rooms.has(room)) rooms.set(room, new Map())
      const clients = rooms.get(room)
      const others = [...clients.keys()]
      clients.set(id, { socket, name: String(msg.name || 'Anonyme').slice(0, 40) })
      safeSend(socket, JSON.stringify({ t: 'welcome', id }))
      broadcastPresence(room)
      // Demande à un pair existant d'envoyer son état complet au nouvel arrivant.
      if (others.length > 0) {
        const peer = clients.get(others[0])
        if (peer) safeSend(peer.socket, JSON.stringify({ t: 'req-snapshot', for: id }))
      }
      return
    }

    if (!room || !rooms.has(room)) return
    const clients = rooms.get(room)

    if (msg.t === 'ops') {
      const payload = JSON.stringify({ t: 'ops', ops: msg.ops })
      for (const [cid, c] of clients) if (cid !== id) safeSend(c.socket, payload)
    } else if (msg.t === 'snapshot' && msg.for) {
      const target = clients.get(msg.for)
      if (target) safeSend(target.socket, JSON.stringify({ t: 'snapshot', ops: msg.ops }))
    }
  })

  socket.on('close', () => {
    if (room && rooms.has(room)) {
      const clients = rooms.get(room)
      clients.delete(id)
      if (clients.size === 0) rooms.delete(room)
      else broadcastPresence(room)
    }
  })

  socket.on('error', () => {
    /* on ignore : le close suivra */
  })
})

console.log(`Kessoku — serveur de synchro à l'écoute sur ws://localhost:${PORT}`)
