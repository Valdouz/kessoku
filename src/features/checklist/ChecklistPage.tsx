import { useMemo, useState } from 'react'
import { ListChecks, Plus, Printer, Search } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
} from '@/components/ui'
import { useMembers, useStore, useTasks } from '@/lib/store'
import { TASK_PHASES, TASK_PRIORITIES, toOptions } from '@/lib/labels'
import type { Task, TaskPhase, TaskPriority } from '@/lib/types'
import { TaskForm } from './TaskForm'
import { TaskRow } from './TaskRow'

// Ordre canonique des phases (clé d'objet => déterministe, mais on fige ici).
const PHASE_ORDER: TaskPhase[] = ['avant', 'montage', 'pendant', 'demontage', 'apres']

/** Date du jour au format ISO "YYYY-MM-DD" (comparaison lexicographique sûre). */
function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

type PhaseFilter = TaskPhase | 'toutes'
type AssigneeFilter = string // '' => tous
type PriorityFilter = TaskPriority | 'toutes'

function ProgressBar({
  done,
  total,
  color,
}: {
  done: number
  total: number
  color?: string
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-night-700">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color ?? '#ff2e85' }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-slate-400">
        {done}/{total} · {pct}%
      </span>
    </div>
  )
}

export function ChecklistPage() {
  const tasks = useTasks()
  const members = useMembers()
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)
  const removeTask = useStore((s) => s.removeTask)
  const reorderTasks = useStore((s) => s.reorderTasks)

  // Filtres
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('toutes')
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('toutes')
  const [hideDone, setHideDone] = useState(false)
  const [search, setSearch] = useState('')

  // Modales
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>(undefined)
  const [toDelete, setToDelete] = useState<Task | undefined>(undefined)

  const today = todayISO()

  // Liste globale triée par order (source de vérité pour le réordonnancement).
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.order - b.order),
    [tasks],
  )

  // Noms de membres + assignees existants (pour le Select de filtre + le form).
  const memberNames = useMemo(
    () => Array.from(new Set(members.map((m) => m.name.trim()).filter(Boolean))),
    [members],
  )
  const assigneeOptions = useMemo(() => {
    const fromTasks = tasks.map((t) => t.assignee.trim()).filter(Boolean)
    const all = Array.from(new Set([...memberNames, ...fromTasks])).sort((a, b) =>
      a.localeCompare(b, 'fr'),
    )
    return [{ value: '', label: 'Tous les assignés' }, ...all.map((n) => ({ value: n, label: n }))]
  }, [tasks, memberNames])

  // Application des filtres (la recherche/assignee/priorité s'appliquent partout).
  const matchesFilters = (t: Task): boolean => {
    if (assigneeFilter && t.assignee.trim() !== assigneeFilter) return false
    if (priorityFilter !== 'toutes' && t.priority !== priorityFilter) return false
    if (hideDone && t.done) return false
    const q = search.trim().toLowerCase()
    if (q) {
      const hay = `${t.title} ${t.assignee} ${t.notes}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }

  const isOverdue = (t: Task): boolean => !t.done && Boolean(t.dueDate) && t.dueDate < today

  // Progression globale (sur TOUTES les tâches, indépendamment des filtres).
  const globalDone = tasks.filter((t) => t.done).length

  // Phases visibles selon le filtre de phase.
  const visiblePhases = phaseFilter === 'toutes' ? PHASE_ORDER : [phaseFilter]

  // Déplacement d'une tâche dans sa phase : on échange avec la tâche
  // précédente/suivante de la MÊME phase dans l'ordre global réel.
  const moveTask = (task: Task, direction: -1 | 1) => {
    const samePhase = sortedTasks.filter((t) => t.phase === task.phase)
    const idx = samePhase.findIndex((t) => t.id === task.id)
    const target = samePhase[idx + direction]
    if (!target) return
    // Indices dans la liste globale
    const ids = sortedTasks.map((t) => t.id)
    const a = ids.indexOf(task.id)
    const b = ids.indexOf(target.id)
    ;[ids[a], ids[b]] = [ids[b], ids[a]]
    reorderTasks(ids)
  }

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (task: Task) => {
    setEditing(task)
    setFormOpen(true)
  }
  const handleSubmit = (values: Partial<Task>) => {
    if (editing) updateTask(editing.id, values)
    else addTask(values)
    setFormOpen(false)
    setEditing(undefined)
  }

  const hasAnyTask = tasks.length > 0

  return (
    <div className="pb-6">
      <PageHeader
        title="Checklist"
        subtitle="Tâches de régie par phase — avant, montage, pendant, démontage, après."
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimer
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} />
              Nouvelle tâche
            </Button>
          </div>
        }
      />

      {/* Progression globale */}
      <Card className="mb-4">
        <CardBody className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Avancement global</h2>
            <span className="text-xs text-slate-400">{tasks.length} tâche(s)</span>
          </div>
          <ProgressBar done={globalDone} total={tasks.length} />
        </CardBody>
      </Card>

      {/* Barre d'outils / filtres */}
      <Card className="no-print mb-5">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Recherche" htmlFor="task-search">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <Input
                id="task-search"
                value={search}
                placeholder="Titre, assigné, notes…"
                className="pl-9"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Phase" htmlFor="filter-phase">
            <Select
              id="filter-phase"
              value={phaseFilter}
              options={[{ value: 'toutes', label: 'Toutes les phases' }, ...toOptions(TASK_PHASES)]}
              onChange={(e) => setPhaseFilter(e.target.value as PhaseFilter)}
            />
          </Field>
          <Field label="Assigné" htmlFor="filter-assignee">
            <Select
              id="filter-assignee"
              value={assigneeFilter}
              options={assigneeOptions}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            />
          </Field>
          <Field label="Priorité" htmlFor="filter-priority">
            <Select
              id="filter-priority"
              value={priorityFilter}
              options={[
                { value: 'toutes', label: 'Toutes priorités' },
                ...toOptions(TASK_PRIORITIES),
              ]}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-night-600 bg-night-800 text-kessoku-500 focus:ring-kessoku-500/50"
              checked={hideDone}
              onChange={(e) => setHideDone(e.target.checked)}
            />
            Masquer les tâches faites
          </label>
        </CardBody>
      </Card>

      {!hasAnyTask ? (
        <EmptyState
          icon={ListChecks}
          title="Aucune tâche pour l'instant"
          description="Ajoutez les tâches de régie à préparer avant, pendant et après le festival."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} />
              Nouvelle tâche
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {visiblePhases.map((phase) => {
            const def = TASK_PHASES[phase]
            const phaseTasks = sortedTasks.filter((t) => t.phase === phase)
            const phaseDone = phaseTasks.filter((t) => t.done).length
            const shown = phaseTasks.filter(matchesFilters)
            // Pour les flèches : ordre réel (non filtré) dans la phase.
            const orderInPhase = phaseTasks.map((t) => t.id)

            return (
              <section key={phase} aria-label={`Phase ${def.label}`}>
                <div className="mb-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: def.color }}
                        aria-hidden
                      />
                      {def.label}
                    </h2>
                  </div>
                  <ProgressBar done={phaseDone} total={phaseTasks.length} color={def.color} />
                </div>

                {phaseTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-night-700 px-4 py-6 text-center text-sm text-slate-500">
                    Aucune tâche dans cette phase.
                  </p>
                ) : shown.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-night-700 px-4 py-6 text-center text-sm text-slate-500">
                    Aucune tâche ne correspond aux filtres.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {shown.map((task) => {
                      const pos = orderInPhase.indexOf(task.id)
                      return (
                        <TaskRow
                          key={task.id}
                          task={task}
                          overdue={isOverdue(task)}
                          canMoveUp={pos > 0}
                          canMoveDown={pos < orderInPhase.length - 1}
                          onToggle={(done) => updateTask(task.id, { done })}
                          onEdit={() => openEdit(task)}
                          onDelete={() => setToDelete(task)}
                          onMoveUp={() => moveTask(task, -1)}
                          onMoveDown={() => moveTask(task, 1)}
                        />
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <TaskForm
        open={formOpen}
        task={editing}
        defaultPhase={phaseFilter === 'toutes' ? undefined : phaseFilter}
        memberNames={memberNames}
        onClose={() => {
          setFormOpen(false)
          setEditing(undefined)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer la tâche"
        message={
          toDelete
            ? `Supprimer « ${toDelete.title} » ? Cette action est définitive.`
            : ''
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          if (toDelete) removeTask(toDelete.id)
        }}
        onClose={() => setToDelete(undefined)}
      />
    </div>
  )
}
