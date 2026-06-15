import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Field,
  Input,
  Select,
} from '@/components/ui'
import { api, useAuth, type Role } from '@/lib/auth'

interface UserRow {
  id: number
  username: string
  role: Role
  created_at: string
}

export function UsersSection() {
  const me = useAuth((s) => s.user)
  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState<UserRow | null>(null)

  const refresh = async () => {
    try {
      const data = await api<{ users: UserRow[] }>('/users')
      setUsers(data.users)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/users', { method: 'POST', body: JSON.stringify({ username, password, role }) })
      setUsername('')
      setPassword('')
      setRole('member')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: number) => {
    setError('')
    try {
      await api(`/users/${id}`, { method: 'DELETE' })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Users size={18} className="text-kessoku-300" />
          Utilisateurs
        </h2>
        <span className="text-xs text-slate-500">{users.length} compte(s)</span>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-xs text-slate-500">
          Crée les comptes de la régie. Chacun se connecte avec son identifiant et son mot de passe.
        </p>

        <form onSubmit={create} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <Field label="Identifiant" htmlFor="nu-name">
            <Input id="nu-name" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Mot de passe" htmlFor="nu-pass" hint="6 car. min">
            <Input id="nu-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Rôle" htmlFor="nu-role">
            <Select
              id="nu-role"
              value={role}
              options={[
                { value: 'member', label: 'Membre' },
                { value: 'admin', label: 'Administrateur' },
              ]}
              onChange={(e) => setRole(e.target.value as Role)}
            />
          </Field>
          <Button type="submit" disabled={busy || !username || password.length < 6}>
            <Plus size={16} />
            Créer
          </Button>
        </form>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="divide-y divide-night-700 rounded-xl border border-night-700">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-100">{u.username}</span>
                <Badge tone={u.role === 'admin' ? 'bg-kessoku-500/15 text-kessoku-200' : 'bg-night-600 text-slate-300'}>
                  {u.role === 'admin' ? 'Admin' : 'Membre'}
                </Badge>
                {u.id === me?.id && <span className="text-xs text-slate-500">(toi)</span>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-300 hover:bg-red-500/10"
                disabled={u.id === me?.id}
                aria-label={`Supprimer ${u.username}`}
                onClick={() => setToDelete(u)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>
      </CardBody>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer le compte"
        message={`Supprimer le compte « ${toDelete?.username} » ? Cette personne n'aura plus accès.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={() => toDelete && remove(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </Card>
  )
}
