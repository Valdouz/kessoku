import type { ChangeEvent } from 'react'
import { Search } from 'lucide-react'
import { Input, Select } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { MATERIAL_STATUS, toOptions } from '@/lib/labels'
import type { MaterialStatus } from '@/lib/types'

export type StatusFilter = MaterialStatus | 'all'

export interface InventoryFilters {
  search: string
  category: string // 'all' ou nom de catégorie
  status: StatusFilter
  owner: string // 'all' ou nom de provenance
}

interface InventoryToolbarProps {
  filters: InventoryFilters
  categories: string[]
  owners: string[]
  onChange: (patch: Partial<InventoryFilters>) => void
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tous les statuts' },
  ...toOptions(MATERIAL_STATUS),
]

export function InventoryToolbar({
  filters,
  categories,
  owners,
  onChange,
}: InventoryToolbarProps) {
  const categoryOptions: SelectOption[] = [
    { value: 'all', label: 'Toutes les catégories' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]
  const ownerOptions: SelectOption[] = [
    { value: 'all', label: 'Toutes les provenances' },
    ...owners.map((o) => ({ value: o, label: o })),
  ]

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <label htmlFor="inv-search" className="sr-only">
          Rechercher un article
        </label>
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <Input
          id="inv-search"
          className="pl-9"
          type="search"
          placeholder="Rechercher un article…"
          value={filters.search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ search: e.target.value })}
        />
      </div>

      <Select
        aria-label="Filtrer par catégorie"
        options={categoryOptions}
        value={filters.category}
        onChange={(e) => onChange({ category: e.target.value })}
      />

      <Select
        aria-label="Filtrer par statut"
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value as StatusFilter })}
      />

      <Select
        aria-label="Filtrer par provenance"
        options={ownerOptions}
        value={filters.owner}
        onChange={(e) => onChange({ owner: e.target.value })}
      />
    </div>
  )
}
