import { useMemo, useState, type ChangeEvent } from 'react'
import { Plus, Printer, Search, HeartHandshake } from 'lucide-react'
import {
  Button,
  PageHeader,
  Modal,
  ConfirmDialog,
  EmptyState,
  Input,
  Select,
  Badge,
} from '@/components/ui'
import { useVolunteers, useFestival, useStore } from '@/lib/store'
import { VOLUNTEER_STATUS, toOptions } from '@/lib/labels'
import { formatDateFR } from '@/lib/time'
import { makeVolunteer } from '@/data/defaults'
import type { Volunteer, VolunteerStatus } from '@/lib/types'
import { VolunteerCard } from './VolunteerCard'
import { VolunteerForm, toFormValues, type VolunteerFormValues } from './VolunteerForm'

type StatusFilter = VolunteerStatus | 'tous'
type MealFilter = 'tous' | 'avec' | 'sans'

const STATUS_KEYS = Object.keys(VOLUNTEER_STATUS) as VolunteerStatus[]
const STATUS_FILTER_OPTIONS = [{ value: 'tous', label: 'Tous les statuts' }, ...toOptions(VOLUNTEER_STATUS)]
const MEAL_FILTER_OPTIONS: { value: MealFilter; label: string }[] = [
  { value: 'tous', label: 'Repas : tous' },
  { value: 'avec', label: 'Avec repas' },
  { value: 'sans', label: 'Sans repas' },
]

type Editing =
  | { mode: 'create' }
  | { mode: 'edit'; id: string }

export function VolunteersPage() {
  const volunteers = useVolunteers()
  const festival = useFestival()
  const addVolunteer = useStore((s) => s.addVolunteer)
  const updateVolunteer = useStore((s) => s.updateVolunteer)
  const removeVolunteer = useStore((s) => s.removeVolunteer)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous')
  const [mealFilter, setMealFilter] = useState<MealFilter>('tous')

  const [editing, setEditing] = useState<Editing | null>(null)
  const [form, setForm] = useState<VolunteerFormValues>(() => toFormValues(makeVolunteer()))
  const [toDelete, setToDelete] = useState<Volunteer | null>(null)

  // Compteurs par statut (sur l'ensemble des bénévoles, hors filtre).
  const counts = useMemo(() => {
    const acc = { pressenti: 0, confirme: 0, indisponible: 0 } as Record<VolunteerStatus, number>
    for (const v of volunteers) acc[v.status]++
    return acc
  }, [volunteers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return volunteers
      .filter((v) => (statusFilter === 'tous' ? true : v.status === statusFilter))
      .filter((v) => {
        if (mealFilter === 'avec') return v.mealIncluded
        if (mealFilter === 'sans') return !v.mealIncluded
        return true
      })
      .filter((v) => (q ? v.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
  }, [volunteers, query, statusFilter, mealFilter])

  const hasVolunteers = volunteers.length > 0
  const hasResults = filtered.length > 0

  function openCreate() {
    setForm(toFormValues(makeVolunteer()))
    setEditing({ mode: 'create' })
  }

  function openEdit(volunteer: Volunteer) {
    setForm(toFormValues(volunteer))
    setEditing({ mode: 'edit', id: volunteer.id })
  }

  function closeModal() {
    setEditing(null)
  }

  function patchForm(patch: Partial<VolunteerFormValues>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function save() {
    if (!editing) return
    const payload: VolunteerFormValues = { ...form, name: form.name.trim() }
    if (editing.mode === 'create') addVolunteer(payload)
    else updateVolunteer(editing.id, payload)
    setEditing(null)
  }

  function confirmDelete() {
    if (toDelete) removeVolunteer(toDelete.id)
    setToDelete(null)
  }

  const canSave = form.name.trim().length > 0

  return (
    <div>
      {/* En-tête imprimé : identifie la liste. */}
      <div className="mb-4 hidden border-b border-night-700 pb-3 print:block">
        <h1 className="font-display text-2xl font-bold text-white">
          Bénévoles — {festival.name} {festival.edition}
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">
          {festival.date ? formatDateFR(festival.date) : ''}
        </p>
      </div>

      <PageHeader
        title="Bénévoles"
        subtitle="Suivi des bénévoles, de leurs missions et de leurs disponibilités."
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            {hasVolunteers && (
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={18} />
                Imprimer
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus size={18} />
              Ajouter un bénévole
            </Button>
          </div>
        }
      />

      {hasVolunteers && (
        <>
          {/* Barre d'outils : recherche + filtres (masquée à l'impression) */}
          <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                className="pl-9"
                type="search"
                value={query}
                placeholder="Rechercher un bénévole…"
                aria-label="Rechercher un bénévole par nom"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              />
            </div>
            <Select
              className="sm:w-48"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              aria-label="Filtrer par statut"
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
            />
            <Select
              className="sm:w-44"
              options={MEAL_FILTER_OPTIONS}
              value={mealFilter}
              aria-label="Filtrer par repas"
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setMealFilter(e.target.value as MealFilter)
              }
            />
          </div>

          {/* Compteurs par statut */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {STATUS_KEYS.map((key) => (
              <Badge key={key} tone={VOLUNTEER_STATUS[key].badge}>
                {counts[key]} {VOLUNTEER_STATUS[key].label.toLowerCase()}
                {counts[key] > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* Contenu */}
      {!hasVolunteers ? (
        <EmptyState
          icon={HeartHandshake}
          title="Aucun bénévole"
          description="Ajoutez les bénévoles du festival pour suivre leurs missions et leurs disponibilités."
          action={
            <Button onClick={openCreate}>
              <Plus size={18} />
              Ajouter un bénévole
            </Button>
          }
        />
      ) : !hasResults ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Aucun bénévole ne correspond à votre recherche ou à vos filtres."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((volunteer) => (
            <VolunteerCard
              key={volunteer.id}
              volunteer={volunteer}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={closeModal}
        title={editing?.mode === 'edit' ? 'Modifier le bénévole' : 'Nouveau bénévole'}
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
        <VolunteerForm values={form} onChange={patchForm} />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer le bénévole"
        message={`Supprimer « ${toDelete?.name || 'ce bénévole'} » de la liste ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
