import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { MaterialItem, MaterialStatus } from '@/lib/types'
import { formatEUR } from './format'
import { MaterialRow } from './MaterialRow'

interface CategoryGroupProps {
  category: string
  items: MaterialItem[]
  qtyTotal: number
  valueTotal: number
  open: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: MaterialStatus) => void
  onEdit: (item: MaterialItem) => void
  onDelete: (item: MaterialItem) => void
}

export function CategoryGroup({
  category,
  items,
  qtyTotal,
  valueTotal,
  open,
  onToggle,
  onStatusChange,
  onEdit,
  onDelete,
}: CategoryGroupProps) {
  const panelId = `cat-panel-${category.replace(/\s+/g, '-')}`

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-night-800/60"
      >
        <span className="text-slate-400" aria-hidden="true">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-white">{category}</span>
        <span className="shrink-0 text-xs text-slate-400">
          {qtyTotal} art. · {items.length} ligne{items.length > 1 ? 's' : ''}
        </span>
        <span className="shrink-0 text-sm font-medium tabular-nums text-stellar-300">
          {formatEUR(valueTotal)}
        </span>
      </button>

      {open && (
        <div id={panelId}>
          {items.map((item) => (
            <MaterialRow
              key={item.id}
              item={item}
              onStatusChange={(status) => onStatusChange(item.id, status)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
