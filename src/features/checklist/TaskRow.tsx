import { Calendar, ChevronDown, ChevronUp, Pencil, Trash2, User } from 'lucide-react'
import { Badge, Button, cn } from '@/components/ui'
import { TASK_PRIORITIES } from '@/lib/labels'
import { formatDateShortFR } from '@/lib/time'
import type { Task } from '@/lib/types'

export interface TaskRowProps {
  task: Task
  /** dueDate < aujourd'hui et tâche non faite. */
  overdue: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggle: (done: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function TaskRow({
  task,
  overdue,
  canMoveUp,
  canMoveDown,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TaskRowProps) {
  const prio = TASK_PRIORITIES[task.priority]
  const checkboxId = `task-done-${task.id}`

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl border border-night-700 bg-night-850/60 p-3 transition',
        task.done && 'opacity-60',
      )}
    >
      {/* Case à cocher */}
      <input
        id={checkboxId}
        type="checkbox"
        checked={task.done}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-night-600 bg-night-800 text-kessoku-500 focus:ring-kessoku-500/50"
      />

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <label
            htmlFor={checkboxId}
            className={cn(
              'cursor-pointer break-words text-sm font-medium text-slate-100',
              task.done && 'text-slate-400 line-through',
            )}
          >
            {task.title}
          </label>
          <Badge tone={prio.badge}>{prio.label}</Badge>
        </div>

        {(task.assignee || task.dueDate) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            {task.assignee && (
              <span className="inline-flex items-center gap-1">
                <User size={13} aria-hidden />
                {task.assignee}
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  overdue && 'font-semibold text-red-400',
                )}
              >
                <Calendar size={13} aria-hidden />
                {formatDateShortFR(task.dueDate)}
                {overdue && <span className="sr-only"> (en retard)</span>}
                {overdue && <span aria-hidden> · en retard</span>}
              </span>
            )}
          </div>
        )}

        {task.notes && (
          <p className="mt-1.5 whitespace-pre-line break-words text-xs text-slate-500">
            {task.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Monter la tâche"
          >
            <ChevronUp size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Descendre la tâche"
          >
            <ChevronDown size={15} />
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Modifier la tâche">
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Supprimer la tâche"
          className="text-slate-400 hover:text-red-400"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </li>
  )
}
