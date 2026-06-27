// Authentification côté client : jeton JWT + utilisateur courant.
// Le jeton est stocké en localStorage et envoyé en Authorization Bearer aux
// appels /api, et en paramètre ?token= à la connexion WebSocket (/sync).

import { useMemo } from 'react'
import { create } from 'zustand'

export type Role = 'admin' | 'member'
export interface AuthUser {
  id: number
  username: string
  role: Role
  discordId?: string | null
}

/** Cible d'un aperçu « voir en tant que » (admin uniquement). */
export interface PreviewTarget {
  id: number
  username: string
  role: Role
  eventAccess: string // '*' ou JSON d'ids d'événements
}

const KEY = 'kessoku.auth'

function load(): { token: string | null; user: AuthUser | null } {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const o = JSON.parse(raw)
      return { token: o.token ?? null, user: o.user ?? null }
    }
  } catch {
    /* ignore */
  }
  return { token: null, user: null }
}
function save(token: string, user: AuthUser) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, user }))
  } catch {
    /* ignore */
  }
}
function clearStored() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** Jeton courant (utilisé par la couche collaborative). */
export function getToken(): string | null {
  return useAuth.getState().token
}

/** Appel JSON authentifié vers l'API. Lève une Error avec le message serveur. */
export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = useAuth.getState().token
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erreur ${res.status}`)
  return data as T
}

export type AuthStatus = 'loading' | 'anon' | 'authed'

interface AuthState {
  token: string | null
  user: AuthUser | null
  status: AuthStatus
  error: string
  /** Message transitoire (ex. retour de liaison Discord). */
  notice: { kind: 'ok' | 'err'; text: string } | null
  /** Aperçu « voir en tant que » (admin) — purement visuel, n'affecte pas le compte. */
  previewAs: PreviewTarget | null
  login: (username: string, password: string) => Promise<boolean>
  claimDiscordLogin: (code: string) => Promise<boolean>
  logout: () => void
  bootstrap: () => Promise<void>
  setNotice: (notice: AuthState['notice']) => void
  setPreviewAs: (target: PreviewTarget | null) => void
  exitPreview: () => void
}

const init = load()

export const useAuth = create<AuthState>((set, get) => ({
  token: init.token,
  user: init.user,
  status: init.token ? 'loading' : 'anon',
  error: '',
  notice: null,
  previewAs: null,
  setNotice: (notice) => set({ notice }),
  setPreviewAs: (target) => set({ previewAs: target }),
  exitPreview: () => set({ previewAs: null }),

  login: async (username, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        set({ error: (data as { error?: string }).error || 'Échec de la connexion.' })
        return false
      }
      save(data.token, data.user)
      set({ token: data.token, user: data.user, status: 'authed', error: '' })
      return true
    } catch {
      set({ error: 'Serveur injoignable.' })
      return false
    }
  },

  // Termine une connexion « Se connecter avec Discord » via le code à usage unique.
  claimDiscordLogin: async (code) => {
    try {
      const res = await fetch('/api/auth/discord/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        set({ error: (data as { error?: string }).error || 'Échec de la connexion Discord.' })
        return false
      }
      save(data.token, data.user)
      set({ token: data.token, user: data.user, status: 'authed', error: '' })
      return true
    } catch {
      set({ error: 'Serveur injoignable.' })
      return false
    }
  },

  logout: () => {
    clearStored()
    set({ token: null, user: null, status: 'anon', error: '', previewAs: null })
  },

  bootstrap: async () => {
    if (!get().token) {
      set({ status: 'anon' })
      return
    }
    try {
      const data = await api<{ user: AuthUser }>('/me')
      set({ user: data.user, status: 'authed' })
    } catch {
      clearStored()
      set({ token: null, user: null, status: 'anon' })
    }
  },
}))

// ── Aperçu « voir en tant que » ──────────────────────────────────────────────
export const usePreview = () => useAuth((s) => s.previewAs)

/** Rôle effectif : celui de l'aperçu si actif, sinon celui du compte. */
export const useEffectiveRole = (): Role | null =>
  useAuth((s) => s.previewAs?.role ?? s.user?.role ?? null)

/**
 * Ids d'événements visibles : null = tous (admin / pas d'aperçu),
 * sinon le périmètre du compte prévisualisé.
 */
export function useAllowedEventIds(): Set<string> | null {
  const previewAs = useAuth((s) => s.previewAs)
  return useMemo(() => {
    if (!previewAs || previewAs.role === 'admin' || previewAs.eventAccess === '*') return null
    try {
      const arr = JSON.parse(previewAs.eventAccess)
      return new Set(Array.isArray(arr) ? (arr as string[]) : [])
    } catch {
      return new Set<string>()
    }
  }, [previewAs])
}
