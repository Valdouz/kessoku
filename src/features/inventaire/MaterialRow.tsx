import { MapPin, Pencil, Trash2, User } from 'lucide-react'
import { Button, Select } from '@/components/ui'
import { MATERIAL_STATUS, toOptions } from '@/lib/labels'
import type { MaterialItem, MaterialStatus } from '@/lib/types'
import { formatEUR, lineTotal } from './format'

interface MaterialRowProps {
  item: MaterialItem
  onStatusChange: (status: MaterialStatus) => void
  onEdit: () => void
  onDelete: () => void
}

const STATUS_OPTIONS = toOptions(MATERIAL_STATUS)

export function MaterialRow({ item, onStatusChange, onEdit, onDelete }: MaterialRowProps) {
  const total = lineTotal(item.qty, item.unitPrice)

  return (
    <div className="flex flex-col gap-3 border-t border-night-700 px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:gap-4">
      {/* Identité */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-medium text-white">{item.name}</span>
          <span className="shrink-0 text-sm text-slate-400">×{item.qty}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {item.owner && <span>{item.owner}</span>}
          {item.assignedTo && (
            <span className="inline-flex items-center gap-1">
              <User size={12} aria-hidden="true" />
              {item.assignedTo}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" />
              {item.location}
            </span>
          )}
        </div>
        {item.notes && <p className="mt-1 text-xs text-slate-500">{item.notes}</p>}
      </div>

      {/* Prix */}
      <div className="shrink-0 text-left sm:w-32 sm:text-right">
        {item.unitPrice != null ? (
          <>
            <div className="font-medium tabular-nums text-slate-100">{formatEUR(total)}</div>
            {item.qty > 1 && (
              <div className="text-xs text-slate-500">{formatEUR(item.unitPrice)} / u.</div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-600">—</div>
        )}
      </div>

      {/* Statut + actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Select
          aria-label={`Statut de ${item.name}`}
          className="no-print h-9 w-36 text-xs"
          options={STATUS_OPTIONS}
          value={item.status}
          onChange={(e) => onStatusChange(e.target.value as MaterialStatus)}
        />
        {/* Libellé imprimable du statut (le Select n'apparaît pas à l'impression) */}
        <span className="hidden text-xs text-slate-300 print:inline">
          {MATERIAL_STATUS[item.status].label}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Modifier ${item.name}`}
          onClick={onEdit}
          className="no-print"
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Supprimer ${item.name}`}
          onClick={onDelete}
          className="no-print text-red-300 hover:text-red-200"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}
