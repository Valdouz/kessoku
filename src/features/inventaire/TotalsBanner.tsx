import { Badge } from '@/components/ui'
import { MATERIAL_STATUS } from '@/lib/labels'
import type { MaterialStatus } from '@/lib/types'
import { formatEUR } from './format'

export interface InventoryTotals {
  itemCount: number // somme des qty
  lineCount: number // nb de lignes d'inventaire
  totalValue: number
  missingValue: number
  byStatus: Record<MaterialStatus, number> // nb de lignes par statut
}

const STATUS_ORDER = Object.keys(MATERIAL_STATUS) as MaterialStatus[]

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-night-700 bg-night-800/60 px-3 py-2">
      <div className="text-lg font-semibold tabular-nums text-white sm:text-xl">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

export function TotalsBanner({ totals }: { totals: InventoryTotals }) {
  return (
    <div className="card mb-5 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Articles (quantité)" value={String(totals.itemCount)} />
        <Stat label="Lignes d'inventaire" value={String(totals.lineCount)} />
        <Stat label="Valeur totale" value={formatEUR(totals.totalValue)} />
        <Stat label="Valeur manquante" value={formatEUR(totals.missingValue)} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_ORDER.map((s) => {
          const def = MATERIAL_STATUS[s]
          const count = totals.byStatus[s]
          if (count === 0) return null
          return (
            <Badge key={s} tone={def.badge}>
              {def.label} · {count}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
