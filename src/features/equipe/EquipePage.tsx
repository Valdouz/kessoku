import { useMemo, useState, type ChangeEvent } from 'react'
import { Plus, Search, Users, Handshake, ExternalLink, UserPlus } from 'lucide-react'
import {
  Button,
  PageHeader,
  Modal,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Select,
} from '@/components/ui'
import { useMembers, useStore } from '@/lib/store'
import { MEMBER_ROLES, toOptions } from '@/lib/labels'
import { makeMember } from '@/data/defaults'
import type { Member, MemberRole } from '@/lib/types'
import { MemberCard } from './MemberCard'
import { MemberForm, toFormValues, type MemberFormValues } from './MemberForm'

const ROLE_FILTER_OPTIONS = [{ value: 'all', label: 'Tous les rôles' }, ...toOptions(MEMBER_ROLES)]

type Editing =
  | { mode: 'create' }
  | { mode: 'edit'; id: string }

/** Regroupement d'affichage : équipe interne, partenaires, contacts externes. */
type Group = 'equipe' | 'partenaires' | 'externes'

function groupOf(m: Member): Group {
  if (m.role === 'contact_externe') return 'externes'
  if (m.isPartner) return 'partenaires'
  return 'equipe'
}

const SECTIONS: { key: Group; title: string; icon: typeof Users; desc: string }[] = [
  { key: 'equipe', title: 'Équipe', icon: Users, desc: 'Régie, coordination & bénévoles' },
  { key: 'partenaires', title: 'Partenaires', icon: Handshake, desc: 'Structures associées' },
  { key: 'externes', title: 'Contacts externes', icon: ExternalLink, desc: 'Prestataires & interlocuteurs' },
]

export function EquipePage() {
  const members = useMembers()
  const addMember = useStore((s) => s.addMember)
  const updateMember = useStore((s) => s.updateMember)
  const removeMember = useStore((s) => s.removeMember)

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all')

  const [editing, setEditing] = useState<Editing | null>(null)
  const [form, setForm] = useState<MemberFormValues>(() => toFormValues(makeMember()))
  const [toDelete, setToDelete] = useState<Member | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members
      .filter((m) => (roleFilter === 'all' ? true : m.role === roleFilter))
      .filter((m) => {
        if (!q) return true
        return m.name.toLowerCase().includes(q) || m.org.toLowerCase().includes(q)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
  }, [members, query, roleFilter])

  const grouped = useMemo(() => {
    const out: Record<Group, Member[]> = { equipe: [], partenaires: [], externes: [] }
    for (const m of filtered) out[groupOf(m)].push(m)
    return out
  }, [filtered])

  const hasAnyMember = members.length > 0
  const hasResults = filtered.length > 0
  const isFiltering = query.trim().length > 0 || roleFilter !== 'all'

  function openCreate() {
    setForm(toFormValues(makeMember()))
    setEditing({ mode: 'create' })
  }

  function openEdit(member: Member) {
    setForm(toFormValues(member))
    setEditing({ mode: 'edit', id: member.id })
  }

  function closeModal() {
    setEditing(null)
  }

  function patchForm(patch: Partial<MemberFormValues>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function save() {
    if (!editing) return
    const payload: MemberFormValues = { ...form, name: form.name.trim() }
    if (editing.mode === 'create') {
      addMember(payload)
    } else {
      updateMember(editing.id, payload)
    }
    setEditing(null)
  }

  function confirmDelete() {
    if (toDelete) removeMember(toDelete.id)
    setToDelete(null)
  }

  const canSave = form.name.trim().length > 0

  return (
    <div>
      <PageHeader
        title="Équipe & contacts"
        subtitle="Annuaire de la régie, des partenaires et des contacts externes."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Ajouter
          </Button>
        }
      />

      {hasAnyMember && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Field label="Recherche" htmlFor="equipe-search" className="sm:max-w-xs">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                id="equipe-search"
                value={query}
                placeholder="Nom ou organisation…"
                className="pl-9"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Filtrer par rôle" htmlFor="equipe-role" className="sm:max-w-xs">
            <Select
              id="equipe-role"
              options={ROLE_FILTER_OPTIONS}
              value={roleFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setRoleFilter(e.target.value as 'all' | MemberRole)
              }
            />
          </Field>
        </div>
      )}

      {!hasAnyMember && (
        <EmptyState
          icon={UserPlus}
          title="Aucun membre"
          description="Ajoutez les personnes de la régie, vos partenaires et vos contacts externes pour garder tout l'annuaire à portée de main."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} />
              Ajouter un membre
            </Button>
          }
        />
      )}

      {hasAnyMember && !hasResults && (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Aucun membre ne correspond à votre recherche ou au filtre sélectionné."
        />
      )}

      {hasResults && (
        <div className="flex flex-col gap-8">
          {SECTIONS.map((section) => {
            const list = grouped[section.key]
            if (list.length === 0) return null
            const Icon = section.icon
            return (
              <section key={section.key}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon size={18} className="text-kessoku-300" />
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  <span className="rounded-full bg-night-700 px-2 py-0.5 text-xs font-medium text-slate-400">
                    {list.length}
                  </span>
                  {!isFiltering && (
                    <span className="ml-1 hidden text-xs text-slate-500 sm:inline">{section.desc}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onEdit={openEdit}
                      onDelete={setToDelete}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={closeModal}
        title={editing?.mode === 'edit' ? 'Modifier le membre' : 'Nouveau membre'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Annuler
            </Button>
            <Button onClick={save} disabled={!canSave}>
              Enregistrer
            </Button>
          </>
        }
      >
        <MemberForm values={form} onChange={patchForm} />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer le membre"
        message={`Supprimer « ${toDelete?.name || 'ce membre'} » de l'annuaire ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
