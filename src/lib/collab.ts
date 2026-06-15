// ──────────────────────────────────────────────────────────────────────────
// Client de collaboration temps réel (authentifié).
// - le serveur est AUTORITAIRE : à la connexion on adopte son snapshot ;
// - ensuite on diffuse les changements locaux (diff -> ops) et on applique les
//   ops distantes (sans écho), en last-write-wins ;
// - présence (qui est en ligne) + reconnexion automatique.
// La connexion exige un jeton valide (?token=) sinon le serveur refuse.
// ──────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { useStore } from './store'
import { getToken } from './auth'
import { diffRoots, rootToOps, type Op } from './syncProtocol'
import type { FestivalEvent, RootData } from './types'

export type CollabStatus = 'off' | 'connecting' | 'online' | 'error'
export interface CollabUser {
  id: string
  name: string
}

const ROOM = (import.meta.env.VITE_SYNC_ROOM as string | undefined) || 'main'

function syncUrl(): string {
  const env = import.meta.env.VITE_SYNC_URL as string | undefined
  if (env) return env
  if (typeof location === 'undefined') return 'ws://localhost:1234'
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/sync`
}

// État transport (hors React)
let ws: WebSocket | null = null
let applyingRemote = false
let lastSynced: RootData = { events: [], currentEventId: '' }
let manualClose = false
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let failures = 0
let subscribed = false

const getRoot = (): RootData => {
  const s = useStore.getState()
  return { events: s.events, currentEventId: s.currentEventId }
}

function applyRemoteOps(ops: Op[]) {
  applyingRemote = true
  useStore.getState().applyRemoteOps(ops)
  applyingRemote = false
  lastSynced = getRoot()
}
function adoptSnapshot(events: FestivalEvent[]) {
  applyingRemote = true
  useStore.getState().replaceEvents(events)
  applyingRemote = false
  lastSynced = getRoot()
}

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
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: 'ops', ops }))
  })
}

interface CollabState {
  status: CollabStatus
  users: CollabUser[]
  error: string
  connect: () => void
  disconnect: () => void
}

export const useCollab = create<CollabState>(() => ({
  status: 'off',
  users: [],
  error: '',
  connect: () => {
    if (!getToken()) {
      useCollab.setState({ status: 'error', error: 'Connecte-toi pour activer la synchro.' })
      return
    }
    ensureSubscription()
    manualClose = false
    failures = 0
    useCollab.setState({ status: 'connecting', error: '', users: [] })
    openSocket()
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
    useCollab.setState({ status: 'off', users: [] })
  },
}))

function openSocket() {
  const token = getToken()
  if (!token) return
  try {
    ws?.close()
  } catch {
    /* ignore */
  }
  const base = syncUrl()
  const url = `${base}${base.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
  let socket: WebSocket
  try {
    socket = new WebSocket(url)
  } catch {
    useCollab.setState({ status: 'error', error: 'URL de serveur invalide.' })
    return
  }
  ws = socket

  socket.onopen = () => {
    failures = 0
    socket.send(JSON.stringify({ t: 'join', room: ROOM }))
    lastSynced = getRoot()
    useCollab.setState({ status: 'online', error: '' })
  }

  socket.onmessage = (ev) => {
    let msg: { t?: string; users?: CollabUser[]; ops?: Op[]; root?: RootData; empty?: boolean }
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    switch (msg.t) {
      case 'presence':
        useCollab.setState({ users: msg.users ?? [] })
        break
      case 'snapshot':
        if (msg.empty) {
          // Serveur vierge : on l'amorce avec notre état local.
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ t: 'ops', ops: rootToOps(getRoot()) }))
          }
          lastSynced = getRoot()
        } else if (msg.root && Array.isArray(msg.root.events)) {
          // Le serveur fait foi : on adopte ses données.
          adoptSnapshot(msg.root.events)
        }
        break
      case 'ops':
        if (Array.isArray(msg.ops)) applyRemoteOps(msg.ops)
        break
    }
  }

  socket.onerror = () => {
    useCollab.setState({ status: 'error', error: 'Connexion au serveur impossible.' })
  }

  socket.onclose = () => {
    if (manualClose) return
    failures++
    if (failures > 6 || !getToken()) {
      useCollab.setState({ status: 'error', error: 'Synchro interrompue. Recharge ou reconnecte-toi.' })
      return
    }
    useCollab.setState({ status: 'connecting' })
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(openSocket, 2500)
  }
}

/** Connexion automatique si l'utilisateur est authentifié. */
export function initCollab() {
  if (getToken()) useCollab.getState().connect()
}

/** Coupe la synchro (à la déconnexion). */
export function stopCollab() {
  useCollab.getState().disconnect()
}
