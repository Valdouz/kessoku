// ──────────────────────────────────────────────────────────────────────────
// Client de collaboration temps réel.
// - écoute le store et diffuse les changements (diffRoots -> ops) au serveur ;
// - applique les ops distantes sans les ré-émettre (last-write-wins) ;
// - gère la présence (qui est en ligne) et la reconnexion automatique.
// Local-first : tout marche hors-ligne, la synchro est un bonus quand connecté.
// ──────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { useStore } from './store'
import { diffRoots, rootToOps, type Op } from './syncProtocol'
import type { RootData } from './types'

export type CollabStatus = 'off' | 'connecting' | 'online' | 'error'
export interface CollabUser {
  id: string
  name: string
}
export interface CollabConfig {
  url: string
  room: string
  name: string
}

const CONFIG_KEY = 'kessoku.collab'

function defaultWsUrl(): string {
  const env = import.meta.env.VITE_SYNC_URL as string | undefined
  if (env) return env
  if (typeof location === 'undefined') return 'ws://localhost:1234'
  // Par défaut : même origine, chemin /sync (proxifié vers le serveur de synchro).
  // => marche en HTTP comme en HTTPS (wss), y compris derrière un tunnel Cloudflare.
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/sync`
}

function loadConfig(): CollabConfig & { autoConnect: boolean } {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const c = JSON.parse(raw)
      return {
        url: c.url || defaultWsUrl(),
        room: c.room || '',
        name: c.name || '',
        autoConnect: Boolean(c.autoConnect),
      }
    }
  } catch {
    /* ignore */
  }
  return { url: defaultWsUrl(), room: '', name: '', autoConnect: false }
}

function persistConfig(cfg: CollabConfig, autoConnect: boolean) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...cfg, autoConnect }))
  } catch {
    /* ignore */
  }
}

// État interne du transport (hors React).
let ws: WebSocket | null = null
let applyingRemote = false
let lastSynced: RootData = { events: [], currentEventId: '' }
let manualClose = false
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let subscribed = false

const getRoot = (): RootData => {
  const s = useStore.getState()
  return { events: s.events, currentEventId: s.currentEventId }
}

function applyRemote(ops: Op[]) {
  applyingRemote = true
  useStore.getState().applyRemoteOps(ops)
  applyingRemote = false
  lastSynced = getRoot()
}

// S'abonne une seule fois aux changements du store pour diffuser les ops.
function ensureSubscription() {
  if (subscribed) return
  subscribed = true
  useStore.subscribe(() => {
    const next = getRoot()
    if (applyingRemote) {
      lastSynced = next
      return
    }
    const ops = diffRoots(lastSynced, next)
    if (ops.length === 0) return
    lastSynced = next
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ t: 'ops', ops }))
    }
  })
}

interface CollabState {
  status: CollabStatus
  users: CollabUser[]
  config: CollabConfig
  error: string
  connect: (cfg: CollabConfig) => void
  disconnect: () => void
}

const initial = loadConfig()

export const useCollab = create<CollabState>((set, get) => ({
  status: 'off',
  users: [],
  config: { url: initial.url, room: initial.room, name: initial.name },
  error: '',

  connect: (cfg) => {
    if (!cfg.room.trim()) {
      set({ status: 'error', error: 'Indique un code de room.' })
      return
    }
    ensureSubscription()
    manualClose = false
    persistConfig(cfg, true)
    set({ config: cfg, status: 'connecting', error: '', users: [] })
    openSocket(cfg)
  },

  disconnect: () => {
    manualClose = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    try {
      ws?.close()
    } catch {
      /* ignore */
    }
    ws = null
    persistConfig(get().config, false)
    set({ status: 'off', users: [] })
  },
}))

function openSocket(cfg: CollabConfig) {
  try {
    ws?.close()
  } catch {
    /* ignore */
  }
  let socket: WebSocket
  try {
    socket = new WebSocket(cfg.url)
  } catch {
    useCollab.setState({ status: 'error', error: 'URL de serveur invalide.' })
    return
  }
  ws = socket

  socket.onopen = () => {
    socket.send(JSON.stringify({ t: 'join', room: cfg.room.trim(), name: cfg.name.trim() || 'Anonyme' }))
    // Partage notre état complet pour converger avec les pairs déjà présents.
    socket.send(JSON.stringify({ t: 'ops', ops: rootToOps(getRoot()) }))
    lastSynced = getRoot()
    useCollab.setState({ status: 'online', error: '' })
  }

  socket.onmessage = (ev) => {
    let msg: { t?: string; users?: CollabUser[]; ops?: Op[]; for?: string }
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    switch (msg.t) {
      case 'presence':
        useCollab.setState({ users: msg.users ?? [] })
        break
      case 'req-snapshot':
        socket.send(JSON.stringify({ t: 'snapshot', for: msg.for, ops: rootToOps(getRoot()) }))
        break
      case 'snapshot':
      case 'ops':
        if (Array.isArray(msg.ops)) applyRemote(msg.ops)
        break
    }
  }

  socket.onerror = () => {
    useCollab.setState({ status: 'error', error: 'Connexion au serveur impossible.' })
  }

  socket.onclose = () => {
    if (manualClose) return
    useCollab.setState({ status: 'connecting' })
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => openSocket(useCollab.getState().config), 2500)
  }
}

/** Auto-connexion au démarrage si une config a été enregistrée. */
export function initCollab() {
  const c = loadConfig()
  if (c.autoConnect && c.room) {
    useCollab.getState().connect({ url: c.url, room: c.room, name: c.name })
  }
}
