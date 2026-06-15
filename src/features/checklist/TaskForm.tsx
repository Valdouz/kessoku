import { useEffect, useState } from 'react'
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui'
import { TASK_PHASES, TASK_PRIORITIES, toOptions } from '@/lib/labels'
import { makeTask } from '@/data/defaults'
import type { Task, TaskPhase, TaskPriority } from '@/lib/types'

export interface TaskFormProps {
  open: boolean
  /** Tâche à éditer ; absente => création. */
  task?: Task
  /** Phase pré-remplie en création (filtre courant). */
  defaultPhase?: TaskPhase
  /** Noms de membres connus (pour suggestions d'assignation). */
  memberNames: string[]
  onClose: () => void
  onSubmit: (values: Partial<Task>) => void
}

/** Construit l'état initial du formulaire à partir d'une tâche ou d'un modèle vierge. */
function initial(task: Task | undefined, defaultPhase: TaskPhase | undefined): Task {
  if (task) return { ...task }
  return makeTask(defaultPhase ? { phase: defaultPhase } : {})
}

export function TaskForm({
  open,
  task,
  defaultPhase,
  memberNames,
  onClose,
  onSubmit,
}: TaskFormProps) {
  const [draft, setDraft] = useState<Task>(() => initial(task, defaultPhase))

  // Réinitialise le formulaire à chaque (ré)ouverture / changement de cible.
  useEffect(() => {
    if (open) setDraft(initial(task, defaultPhase))
  }, [open, task, defaultPhase])

  const isEdit = Boolean(task)
  const canSave = draft.title.trim().length > 0

  const handleSubmit = () => {
    if (!canSave) return
    onSubmit({
      title: draft.title.trim(),
      phase: draft.phase,
      priority: draft.priority,
      assignee: draft.assignee.trim(),
      dueDate: draft.dueDate,
      notes: draft.notes,
      done: draft.done,
    })
  }

  // Suggestions d'assignation : membres connus + valeur courante si absente.
  const assigneeSuggestions = Array.from(
    new Set(
      [...memberNames, draft.assignee].map((n) => n.trim()).filter((n) => n.length > 0),
    ),
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <Field label="Intitulé" htmlFor="task-title">
          <Input
            id="task-title"
            value={draft.title}
            autoFocus
            placeholder="Ex. Vérifier le branchement de la console"
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phase" htmlFor="task-phase">
            <Select
              id="task-phase"
              options={toOptions(TASK_PHASES)}
              value={draft.phase}
              onChange={(e) =>
                setDraft((d) => ({ ...d, phase: e.target.value as TaskPhase }))
              }
            />
          </Field>
          <Field label="Priorité" htmlFor="task-priority">
            <Select
              id="task-priority"
              options={toOptions(TASK_PRIORITIES)}
              value={draft.priority}
              onChange={(e) =>
                setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Assigné à" htmlFor="task-assignee" hint="Membre de l'équipe ou nom libre.">
            <Input
              id="task-assignee"
              value={draft.assignee}
              list="task-assignee-options"
              placeholder="Nom"
              onChange={(e) => setDraft((d) => ({ ...d, assignee: e.target.value }))}
            />
            <datalist id="task-assignee-options">
              {assigneeSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Échéance" htmlFor="task-due">
            <Input
              id="task-due"
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="task-notes">
          <Textarea
            id="task-notes"
            value={draft.notes}
            placeholder="Détails, dépendances, points d'attention…"
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-night-600 bg-night-800 text-kessoku-500 focus:ring-kessoku-500/50"
            checked={draft.done}
            onChange={(e) => setDraft((d) => ({ ...d, done: e.target.checked }))}
          />
          Tâche terminée
        </label>
      </form>
    </Modal>
  )
}
