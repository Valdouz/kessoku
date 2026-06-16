import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, Users, KeyRound } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
} from '@/components/ui'
import { api, useAuth, type Role } from '@/lib/auth'
import { useEvents } from '@/lib/store'

interface UserRow {
  id: number
  username: string
  role: Role
  event_access: string
  created_at: string
}

type Access = '*' | string[]

function parseAccess(raw: string): Access {
  if (raw === '*' || raw == null) return '*'
  try {
    const a = JSON.parse(raw)
    return Array.isArray(a) ? a : '*'
  } catch {
    return '*'
  }
}

/** Choix du périmètre d'accès : tous les événements ou une sélection. */
function AccessPicker({
  events,
  value,
  onChange,
}: {
  events: { id: string; name: string }[]
  value: Access
  onChange: (v: Access) => void
}) {
  const all = value === '*'
  const list = Array.isArray(value) ? value : []
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="radio" checked={all} onChange={() => onChange('*')} className="accent-kessoku-500" />
        Tous les événements
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="radio" checked={!all} onChange={() => onChange(list)} className="accent-kessoku-500" />
        Événements choisis
      </label>
      {!all && (
        <div className="ml-6 space-y-1.5 border-l border-night-700 pl-3">
          {events.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={list.includes(e.id)}
                className="h-4 w-4 rounded border-night-600 bg-night-850 accent-kessoku-500"
                onChange={(ev) => {
                  const set = new Set(list)
                  if (ev.target.checked) set.add(e.id)
                  else set.delete(e.id)
                  onChange([...set])
                }}
              />
              {e.name}
            </label>
          ))}
          {events.length === 0 && <p className="text-xs text-slate-500">Aucun événement pour l'instant.</p>}
        </div>
      )}
    </div>
  )
}

export function UsersSection() {
  const me = useAuth((s) => s.user)
  const events = useEvents().map((e) => ({ id: e.id, name: e.data.festival.name || 'Sans nom' }))
  const eventName = (id: string) => events.find((e) => e.id === id)?.name ?? '1 événement'

  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState<UserRow | null>(null)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [editAccess, setEditAccess] = useState<Access>('*')
  const [resetPw, setResetPw] = useState('')
  const [resetMsg, setResetMsg] = useState('')

  // formulaire de création
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [access, setAccess] = useState<Access>('*')

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
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({ username, password, role, eventAccess: access }),
      })
      setUsername('')
      setPassword('')
      setRole('member')
      setAccess('*')
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

  const openEdit = (u: UserRow) => {
    setEditing(u)
    setEditAccess(parseAccess(u.event_access))
    setResetPw('')
    setResetMsg('')
  }
  const saveEdit = async () => {
    if (!editing) return
    try {
      await api(`/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ eventAccess: editAccess }) })
      setEditing(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }
  const resetPassword = async () => {
    if (!editing || resetPw.length < 6) return
    setResetMsg('')
    try {
      await api(`/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ password: resetPw }) })
      setResetMsg('Mot de passe réinitialisé — la personne a été déconnectée et devra se reconnecter avec le nouveau.')
      setResetPw('')
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const accessSummary = (u: UserRow) => {
    if (u.role === 'admin') return 'Tous (admin)'
    const a = parseAccess(u.event_access)
    if (a === '*') return 'Tous les événements'
    if (a.length === 0) return 'Aucun accès'
    if (a.length === 1) return eventName(a[0])
    return `${a.length} événements`
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
          Crée les comptes de la régie et choisis à quels événements chacun a accès. Un membre ne voit
          que ses événements ; l'admin voit tout.
        </p>

        {/* Création */}
        <form onSubmit={create} className="space-y-3 rounded-xl border border-night-700 bg-night-900/40 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Identifiant" htmlFor="nu-name">
              <Input id="nu-name" value={username} onChange={(e) => setUsername(e.target.value)} />
            </Field>
            <Field label="Mot de passe" htmlFor="nu-pass">
              <Input
                id="nu-pass"
                type="text"
                value={password}
                placeholder="6 caractères min."
                onChange={(e) => setPassword(e.target.value)}
              />
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
          </div>

          {role !== 'admin' && (
            <div>
              <span className="field-label">Accès aux événements</span>
              <AccessPicker events={events} value={access} onChange={setAccess} />
            </div>
          )}

          <Button type="submit" disabled={busy || !username || password.length < 6}>
            <Plus size={16} />
            Créer le compte
          </Button>
        </form>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        {/* Liste */}
        <div className="divide-y divide-night-700 rounded-xl border border-night-700">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-100">{u.username}</span>
                  <Badge tone={u.role === 'admin' ? 'bg-kessoku-500/15 text-kessoku-200' : 'bg-night-600 text-slate-300'}>
                    {u.role === 'admin' ? 'Admin' : 'Membre'}
                  </Badge>
                  {u.id === me?.id && <span className="text-xs text-slate-500">(toi)</span>}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Accès : {accessSummary(u)}</div>
              </div>
              <div className="flex items-center gap-1">
                {u.role !== 'admin' && (
                  <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label={`Modifier l'accès de ${u.username}`}>
                    <KeyRound size={15} />
                  </Button>
                )}
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
            </div>
          ))}
        </div>
      </CardBody>

      {/* Édition de l'accès */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Gérer — ${editing?.username ?? ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Fermer
            </Button>
            <Button onClick={saveEdit}>Enregistrer l'accès</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <span className="field-label">Accès aux événements</span>
            <AccessPicker events={events} value={editAccess} onChange={setEditAccess} />
            <p className="mt-2 text-xs text-slate-500">
              « Enregistrer l'accès » reconnecte la personne pour appliquer le nouveau périmètre.
            </p>
          </div>

          <div className="border-t border-night-700 pt-4">
            <span className="field-label">Réinitialiser le mot de passe</span>
            <p className="mb-2 text-xs text-slate-500">
              Révoque le mot de passe actuel : la personne est déconnectée et devra utiliser le nouveau.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="text"
                value={resetPw}
                placeholder="Nouveau mot de passe (6 car. min.)"
                onChange={(e) => setResetPw(e.target.value)}
              />
              <Button variant="danger" onClick={resetPassword} disabled={resetPw.length < 6}>
                Réinitialiser
              </Button>
            </div>
            {resetMsg && <p className="mt-2 text-xs text-emerald-300">{resetMsg}</p>}
          </div>
        </div>
      </Modal>

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
