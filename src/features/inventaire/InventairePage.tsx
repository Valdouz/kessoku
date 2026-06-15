import { useMemo, useState } from 'react'
import { Boxes, Plus, Printer } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from '@/components/ui'
import { useMaterials, useStore } from '@/lib/store'
import { MATERIAL_STATUS } from '@/lib/labels'
import type { MaterialItem, MaterialStatus } from '@/lib/types'
import { lineTotal } from './format'
import { TotalsBanner, type InventoryTotals } from './TotalsBanner'
import { InventoryToolbar, type InventoryFilters } from './InventoryToolbar'
import { CategoryGroup } from './CategoryGroup'
import { MaterialFormModal } from './MaterialFormModal'

interface CategoryBucket {
  category: string
  items: MaterialItem[]
  qtyTotal: number
  valueTotal: number
}

// Compteurs à zéro pour chaque statut — dérivé de MATERIAL_STATUS pour rester
// exhaustif automatiquement quand on ajoute un statut.
const emptyStatusCounts = (): Record<MaterialStatus, number> => {
  const counts = {} as Record<MaterialStatus, number>
  for (const key of Object.keys(MATERIAL_STATUS) as MaterialStatus[]) counts[key] = 0
  return counts
}

export function InventairePage() {
  const materials = useMaterials()
  const addMaterial = useStore((s) => s.addMaterial)
  const updateMaterial = useStore((s) => s.updateMaterial)
  const removeMaterial = useStore((s) => s.removeMaterial)

  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: 'all',
    status: 'all',
    owner: 'all',
  })
  // État d'ouverture explicite des groupes (true = replié). Ouvert par défaut.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MaterialItem | undefined>(undefined)
  const [toDelete, setToDelete] = useState<MaterialItem | undefined>(undefined)

  // Listes complètes (hors filtre) pour les <Select> et la saisie assistée.
  const categories = useMemo(
    () =>
      [...new Set(materials.map((m) => m.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'fr'),
      ),
    [materials],
  )
  const owners = useMemo(
    () =>
      [...new Set(materials.map((m) => m.owner).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'fr'),
      ),
    [materials],
  )

  // Filtrage (recherche nom + catégorie + statut + provenance).
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return materials.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q)) return false
      if (filters.category !== 'all' && m.category !== filters.category) return false
      if (filters.status !== 'all' && m.status !== filters.status) return false
      if (filters.owner !== 'all' && m.owner !== filters.owner) return false
      return true
    })
  }, [materials, filters])

  // Regroupement par catégorie + totaux de groupe.
  const groups = useMemo<CategoryBucket[]>(() => {
    const map = new Map<string, CategoryBucket>()
    for (const item of filtered) {
      const key = item.category || 'Divers'
      let bucket = map.get(key)
      if (!bucket) {
        bucket = { category: key, items: [], qtyTotal: 0, valueTotal: 0 }
        map.set(key, bucket)
      }
      bucket.items.push(item)
      bucket.qtyTotal += item.qty
      bucket.valueTotal += lineTotal(item.qty, item.unitPrice)
    }
    const buckets = [...map.values()].sort((a, b) =>
      a.category.localeCompare(b.category, 'fr'),
    )
    for (const b of buckets) {
      b.items.sort((x, y) => x.name.localeCompare(y.name, 'fr'))
    }
    return buckets
  }, [filtered])

  // Totaux globaux (sur les items filtrés).
  const totals = useMemo<InventoryTotals>(() => {
    const byStatus = emptyStatusCounts()
    let itemCount = 0
    let totalValue = 0
    let missingValue = 0
    for (const m of filtered) {
      byStatus[m.status] += 1
      itemCount += m.qty
      const v = lineTotal(m.qty, m.unitPrice)
      totalValue += v
      if (m.status === 'manquant') missingValue += v
    }
    return {
      itemCount,
      lineCount: filtered.length,
      totalValue,
      missingValue,
      byStatus,
    }
  }, [filtered])

  const toggleCat = (cat: string) =>
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))

  const updateFilters = (patch: Partial<InventoryFilters>) =>
    setFilters((f) => ({ ...f, ...patch }))

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (item: MaterialItem) => {
    setEditing(item)
    setFormOpen(true)
  }

  const handleSubmit = (patch: Partial<MaterialItem>) => {
    if (editing) updateMaterial(editing.id, patch)
    else addMaterial(patch)
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (toDelete) removeMaterial(toDelete.id)
    setToDelete(undefined)
  }

  const hasAny = materials.length > 0
  const hasResults = groups.length > 0

  return (
    <div>
      <PageHeader
        title="Matériel"
        subtitle="Inventaire technique — regroupé par catégorie."
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimer
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} />
              Ajouter
            </Button>
          </div>
        }
      />

      {!hasAny ? (
        <EmptyState
          icon={Boxes}
          title="Aucun matériel"
          description="Commencez par ajouter les articles de l'inventaire technique."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} />
              Ajouter un article
            </Button>
          }
        />
      ) : (
        <>
          <TotalsBanner totals={totals} />

          <div className="no-print">
            <InventoryToolbar
              filters={filters}
              categories={categories}
              owners={owners}
              onChange={updateFilters}
            />
          </div>

          {hasResults ? (
            <div className="flex flex-col gap-3">
              {groups.map((g) => (
                <CategoryGroup
                  key={g.category}
                  category={g.category}
                  items={g.items}
                  qtyTotal={g.qtyTotal}
                  valueTotal={g.valueTotal}
                  open={!collapsed[g.category]}
                  onToggle={() => toggleCat(g.category)}
                  onStatusChange={(id, status) => updateMaterial(id, { status })}
                  onEdit={openEdit}
                  onDelete={setToDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Boxes}
              title="Aucun résultat"
              description="Aucun article ne correspond à ces filtres."
            />
          )}
        </>
      )}

      <MaterialFormModal
        open={formOpen}
        item={editing}
        categories={categories}
        owners={owners}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer l'article"
        message={
          toDelete
            ? `Supprimer « ${toDelete.name} » de l'inventaire ? Cette action est définitive.`
            : ''
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(undefined)}
      />
    </div>
  )
}
