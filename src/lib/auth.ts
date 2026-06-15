// Authentification côté client : jeton JWT + utilisateur courant.
// Le jeton est stocké en localStorage et envoyé en Authorization Bearer aux
// appels /api, et en paramètre ?token= à la connexion WebSocket (/sync).

import { create } from 'zustand'

export type Role = 'admin' | 'member'
export interface AuthUser {
  id: number
  username: string
  role: Role
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
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  bootstrap: () => Promise<void>
}

const init = load()

export const useAuth = create<AuthState>((set, get) => ({
  token: init.token,
  user: init.user,
  status: init.token ? 'loading' : 'anon',
  error: '',

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

  logout: () => {
    clearStored()
    set({ token: null, user: null, status: 'anon', error: '' })
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
