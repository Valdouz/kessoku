import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui'
import { MATERIAL_STATUS, toOptions } from '@/lib/labels'
import type { MaterialItem, MaterialStatus } from '@/lib/types'
import { makeMaterial } from '@/data/defaults'

interface MaterialFormModalProps {
  open: boolean
  /** Item à éditer ; absent => création. */
  item?: MaterialItem
  /** Catégories existantes pour proposer une saisie assistée. */
  categories: string[]
  /** Provenances existantes (pour la saisie assistée). */
  owners?: string[]
  onClose: () => void
  onSubmit: (patch: Partial<MaterialItem>) => void
}

const STATUS_OPTIONS = toOptions(MATERIAL_STATUS)
// Provenances courantes proposées en plus de celles déjà saisies — permet
// d'ajouter facilement du matériel qui n'est pas de chez nous.
const OWNER_PRESETS = ['Régie', 'Mairie', 'Artiste', 'Location', 'Perso', 'Externe']

export function MaterialFormModal({
  open,
  item,
  categories,
  owners = [],
  onClose,
  onSubmit,
}: MaterialFormModalProps) {
  const ownerOptions = Array.from(new Set([...owners, ...OWNER_PRESETS])).filter(Boolean)
  const [form, setForm] = useState<MaterialItem>(() => item ?? makeMaterial())

  // Réinitialise le formulaire à chaque ouverture (création ou édition).
  useEffect(() => {
    if (open) setForm(item ?? makeMaterial())
  }, [open, item])

  const set = <K extends keyof MaterialItem>(key: K, value: MaterialItem[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const onNumber =
    (key: 'qty' | 'unitPrice') => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw === '') {
        set(key, (key === 'qty' ? 1 : undefined) as MaterialItem[typeof key])
        return
      }
      const n = Number(raw)
      if (!Number.isNaN(n)) set(key, n as MaterialItem[typeof key])
    }

  const submit = () => {
    const name = form.name.trim()
    if (!name) return
    onSubmit({
      name,
      category: form.category.trim() || 'Divers',
      qty: Math.max(0, Math.round(form.qty)),
      unitPrice: form.unitPrice != null ? Math.max(0, form.unitPrice) : undefined,
      owner: form.owner.trim(),
      status: form.status,
      assignedTo: form.assignedTo.trim(),
      location: form.location.trim(),
      notes: form.notes.trim(),
    })
  }

  const isEdit = Boolean(item)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Modifier un article' : 'Ajouter un article'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!form.name.trim()}>
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="mat-name" className="sm:col-span-2">
          <Input
            id="mat-name"
            value={form.name}
            placeholder="Ex. Ampli basse, micro SM58…"
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <Field label="Catégorie" htmlFor="mat-category">
          <Input
            id="mat-category"
            list="mat-categories"
            value={form.category}
            placeholder="Ex. Micros"
            onChange={(e) => set('category', e.target.value)}
          />
          <datalist id="mat-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Statut" htmlFor="mat-status">
          <Select
            id="mat-status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => set('status', e.target.value as MaterialStatus)}
          />
        </Field>

        <Field label="Quantité" htmlFor="mat-qty">
          <Input
            id="mat-qty"
            type="number"
            min={0}
            step={1}
            value={form.qty}
            onChange={onNumber('qty')}
          />
        </Field>

        <Field label="Prix unitaire (€)" htmlFor="mat-price" hint="Optionnel">
          <Input
            id="mat-price"
            type="number"
            min={0}
            step="0.01"
            value={form.unitPrice ?? ''}
            placeholder="—"
            onChange={onNumber('unitPrice')}
          />
        </Field>

        <Field label="Provenance" htmlFor="mat-owner" hint="Qui apporte / propriétaire (interne ou externe)">
          <Input
            id="mat-owner"
            list="mat-owners"
            value={form.owner}
            placeholder="Ex. Régie, Mairie, Artiste…"
            onChange={(e) => set('owner', e.target.value)}
          />
          <datalist id="mat-owners">
            {ownerOptions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </Field>

        <Field label="Responsable" htmlFor="mat-assigned" hint="Transport / installation">
          <Input
            id="mat-assigned"
            value={form.assignedTo}
            placeholder="Ex. Akira"
            onChange={(e) => set('assignedTo', e.target.value)}
          />
        </Field>

        <Field label="Emplacement" htmlFor="mat-location">
          <Input
            id="mat-location"
            value={form.location}
            placeholder="Ex. Caisse 2, scène"
            onChange={(e) => set('location', e.target.value)}
          />
        </Field>

        <Field label="Notes" htmlFor="mat-notes" className="sm:col-span-2">
          <Textarea
            id="mat-notes"
            value={form.notes}
            placeholder="Précisions, état, accessoires…"
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}
