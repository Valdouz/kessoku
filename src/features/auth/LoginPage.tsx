import { useEffect, useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { Button, Field, Input } from '@/components/ui'
import { BRAND } from '@/brand'
import { useAuth } from '@/lib/auth'
import { initCollab } from '@/lib/collab'

export function LoginPage() {
  const login = useAuth((s) => s.login)
  const error = useAuth((s) => s.error)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [discordOn, setDiscordOn] = useState(false)

  useEffect(() => {
    fetch('/api/public-config')
      .then((r) => r.json())
      .then((c) => setDiscordOn(Boolean(c.discordLogin)))
      .catch(() => {})
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const ok = await login(username, password)
    setBusy(false)
    if (ok) initCollab() // connexion temps réel une fois authentifié
  }

  const onDiscord = async () => {
    try {
      const res = await fetch('/api/auth/discord/start?mode=login')
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-night-900 px-4"
      style={{
        backgroundImage:
          'radial-gradient(1000px 500px at 80% -10%, rgba(124,58,237,0.15), transparent), radial-gradient(800px 400px at 0% 110%, rgba(255,46,133,0.12), transparent)',
      }}
    >
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-kessoku-400 to-stellar-600 shadow-glow">
            <span className="whitespace-nowrap text-sm font-bold leading-none tracking-tight text-white">
              {BRAND.kanji}
            </span>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">{BRAND.name}</h1>
            <p className="text-xs text-slate-500">{BRAND.tagline}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Identifiant" htmlFor="login-user">
            <Input
              id="login-user"
              value={username}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field label="Mot de passe" htmlFor="login-pass">
            <Input
              id="login-pass"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={busy || !username || !password}>
            <LogIn size={18} />
            {busy ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>

        {discordOn && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-slate-600">
              <span className="h-px flex-1 bg-night-600" />
              ou
              <span className="h-px flex-1 bg-night-600" />
            </div>
            <button
              type="button"
              onClick={onDiscord}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.7 13.7 0 0 0-.6 1.22 18.27 18.27 0 0 0-5.92 0A13.6 13.6 0 0 0 9.43 3a19.74 19.74 0 0 0-3.76 1.37C2.07 9.86 1.4 15.2 1.73 20.47a19.93 19.93 0 0 0 6.06 3.06c.49-.66.92-1.36 1.29-2.1-.71-.27-1.39-.6-2.03-.99.17-.12.34-.25.5-.38a14.25 14.25 0 0 0 12.1 0c.17.13.33.26.5.38-.64.39-1.32.72-2.03.99.37.74.8 1.44 1.29 2.1a19.9 19.9 0 0 0 6.06-3.06c.39-6.1-.67-11.39-3.95-16.1ZM8.02 16.33c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42c1.2 0 2.17 1.09 2.15 2.42 0 1.34-.95 2.42-2.15 2.42Zm7.96 0c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42c1.2 0 2.17 1.09 2.15 2.42 0 1.34-.94 2.42-2.15 2.42Z" />
              </svg>
              Se connecter avec Discord
            </button>
          </>
        )}

        <p className="mt-5 text-center text-xs text-slate-600">
          Accès réservé à l'équipe. Demande un compte à l'administrateur.
        </p>
      </div>
    </div>
  )
}
