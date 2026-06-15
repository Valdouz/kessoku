import { useState, type FormEvent } from 'react'
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const ok = await login(username, password)
    setBusy(false)
    if (ok) initCollab() // connexion temps réel une fois authentifié
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

        <p className="mt-5 text-center text-xs text-slate-600">
          Accès réservé à l'équipe. Demande un compte à l'administrateur.
        </p>
      </div>
    </div>
  )
}
