import { useState, type FormEvent } from 'react'
import { LogOut, UserCircle } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input } from '@/components/ui'
import { api, useAuth } from '@/lib/auth'
import { stopCollab } from '@/lib/collab'

export function AccountSection() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

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
