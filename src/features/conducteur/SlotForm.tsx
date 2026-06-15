import { useEffect, useState } from 'react'
import { Field, Input, Textarea, Select, Modal, Button } from '@/components/ui'
import { SLOT_TYPES, toOptions } from '@/lib/labels'
import { makeSlot } from '@/data/defaults'
import { addMinutes } from '@/lib/time'
import type { Artist, Slot, SlotType } from '@/lib/types'

interface SlotFormProps {
  open: boolean
  /** Créneau à éditer ; absent => création. */
  slot?: Slot
  /** Liste des artistes pour le lien artistId. */
  artists: Artist[]
  onClose: () => void
  onSubmit: (values: Slot) => void
}

/** Modal de création / édition d'un créneau du conducteur. */
export function SlotForm({ open, slot, artists, onClose, onSubmit }: SlotFormProps) {
  const [draft, setDraft] = useState<Slot>(() => slot ?? makeSlot())

  // Réinitialise le brouillon à chaque ouverture / changement de cible.
  useEffect(() => {
    if (open) setDraft(slot ?? makeSlot())
  }, [open, slot])

  const set = <K extends keyof Slot>(key: K, value: Slot[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const canSave = draft.title.trim().length > 0

  const handleSubmit = () => {
    if (!canSave) return
    onSubmit({ ...draft, title: draft.title.trim() })
  }

  const artistOptions = [
    { value: '', label: '— Aucun artiste lié —' },
    ...artists.map((a) => ({ value: a.id, label: a.name || 'Sans nom' })),
  ]

  const endPreview = addMinutes(draft.startTime, draft.durationMin)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={slot ? 'Modifier le créneau' : 'Nouveau créneau'}
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
        <Field label="Titre du créneau" htmlFor="slot-title">
          <Input
            id="slot-title"
            value={draft.title}
            autoFocus
            placeholder="Ex. Accueil du public"
            onChange={(e) => set('title', e.target.value)}
          />
        </Field>

        <Field label="Type" htmlFor="slot-type">
          <Select
            id="slot-type"
            options={toOptions(SLOT_TYPES)}
            value={draft.type}
            onChange={(e) => set('type', e.target.value as SlotType)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Heure de début" htmlFor="slot-start">
            <Input
              id="slot-start"
              type="time"
              value={draft.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
          </Field>
          <Field
            label="Durée (min)"
            htmlFor="slot-duration"
            hint={`Fin prévue : ${endPreview}`}
          >
            <Input
              id="slot-duration"
              type="number"
              min={0}
              inputMode="numeric"
              value={Number.isFinite(draft.durationMin) ? draft.durationMin : ''}
              placeholder="Ex. 20"
              onChange={(e) =>
                set('durationMin', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Artiste lié" htmlFor="slot-artist" hint="Optionnel">
            <Select
              id="slot-artist"
              options={artistOptions}
              value={draft.artistId ?? ''}
              onChange={(e) => set('artistId', e.target.value === '' ? undefined : e.target.value)}
            />
          </Field>
          <Field label="Scène / zone" htmlFor="slot-stage">
            <Input
              id="slot-stage"
              value={draft.stage}
              placeholder="Ex. Scène principale"
              onChange={(e) => set('stage', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="slot-notes">
          <Textarea
            id="slot-notes"
            value={draft.notes}
            placeholder="Consignes régie, changements de plateau…"
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
