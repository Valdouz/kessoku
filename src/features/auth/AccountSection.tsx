import { useEffect, useState, type FormEvent } from 'react'
import { Link2, LogOut, Unlink, UserCircle } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input } from '@/components/ui'
import { api, useAuth } from '@/lib/auth'
import { stopCollab } from '@/lib/collab'

export function AccountSection() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const notice = useAuth((s) => s.notice)
  const setNotice = useAuth((s) => s.setNotice)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const [discordOn, setDiscordOn] = useState(false)
  const [discordId, setDiscordId] = useState<string | null>(null)

  // État de la liaison Discord (config publique + compte courant).
  useEffect(() => {
    fetch('/api/public-config')
      .then((r) => r.json())
      .then((c) => setDiscordOn(Boolean(c.discordLogin)))
      .catch(() => {})
    api<{ user: { discordId?: string | null } }>('/me')
      .then((d) => setDiscordId(d.user.discordId ?? null))
      .catch(() => {})
  }, [notice])

  const linkDiscord = async () => {
    try {
      const { url } = await api<{ url: string }>('/auth/discord/start?mode=link')
      if (url) window.location.href = url
    } catch {
      setNotice({ kind: 'err', text: 'Impossible de démarrer la liaison Discord.' })
    }
  }
  const unlinkDiscord = async () => {
    try {
      await api('/auth/discord/link', { method: 'DELETE' })
      setDiscordId(null)
      setNotice({ kind: 'ok', text: 'Compte Discord délié.' })
    } catch {
      setNotice({ kind: 'err', text: 'Échec du déliage.' })
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      await api('/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      setMsg({ ok: true, text: 'Mot de passe mis à jour.' })
      setCurrent('')
      setNext('')
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erreur.' })
    } finally {
      setBusy(false)
    }
  }

  const onLogout = () => {
    stopCollab()
    logout()
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <UserCircle size={18} className="text-kessoku-300" />
          Mon compte
        </h2>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut size={15} />
          Déconnexion
        </Button>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          Connecté en tant que <span className="font-semibold text-white">{user?.username}</span>
          <Badge tone={user?.role === 'admin' ? 'bg-kessoku-500/15 text-kessoku-200' : 'bg-night-600 text-slate-300'}>
            {user?.role === 'admin' ? 'Administrateur' : 'Membre'}
          </Badge>
        </div>

        {discordOn && (
          <div className="rounded-xl border border-night-600 bg-night-700/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <span className="font-medium text-white">Compte Discord</span>{' '}
                {discordId ? (
                  <Badge tone="bg-emerald-500/15 text-emerald-200">lié ✓</Badge>
                ) : (
                  <span className="text-slate-400">non lié</span>
                )}
                <p className="mt-0.5 text-xs text-slate-500">
                  Lie ton Discord pour te connecter en un clic la prochaine fois.
                </p>
              </div>
              {discordId ? (
                <Button variant="outline" size="sm" onClick={unlinkDiscord}>
                  <Unlink size={15} />
                  Délier
                </Button>
              ) : (
                <Button size="sm" onClick={linkDiscord}>
                  <Link2 size={15} />
                  Lier mon Discord
                </Button>
              )}
            </div>
            {notice && (
              <p className={`mt-2 text-sm ${notice.kind === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>
                {notice.text}
              </p>
            )}
          </div>
        )}

        <form onSubmit={changePassword} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Mot de passe actuel" htmlFor="cur-pass">
              <Input
                id="cur-pass"
                type="password"
                value={current}
                autoComplete="current-password"
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>
            <Field label="Nouveau mot de passe" htmlFor="new-pass" hint="6 caractères minimum">
              <Input
                id="new-pass"
                type="password"
                value={next}
                autoComplete="new-password"
                onChange={(e) => setNext(e.target.value)}
              />
            </Field>
          </div>
          {msg && (
            <p className={msg.ok ? 'text-sm text-emerald-300' : 'text-sm text-red-300'}>{msg.text}</p>
          )}
          <Button type="submit" variant="secondary" disabled={busy || !current || next.length < 6}>
            Changer le mot de passe
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
