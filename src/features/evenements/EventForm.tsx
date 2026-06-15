import { useEffect, useState } from 'react'
import { Button, Field, Input, Modal, Select } from '@/components/ui'
import { useEvents, useStore } from '@/lib/store'
import { EVENT_KINDS, toOptions } from '@/lib/labels'
import type { EventKind } from '@/lib/types'

interface EventFormProps {
  open: boolean
  onClose: () => void
}

type CopyKey = 'materials' | 'members' | 'tasks' | 'slots' | 'artists'

const COPY_FIELDS: { key: CopyKey; label: string }[] = [
  { key: 'materials', label: 'Matériel / inventaire' },
  { key: 'members', label: 'Équipe & contacts' },
  { key: 'tasks', label: 'Checklist (tâches remises à faire)' },
  { key: 'slots', label: 'Conducteur (déroulé)' },
  { key: 'artists', label: 'Artistes' },
]

const blank = () => ({
  kind: 'concert' as EventKind,
  name: '',
  date: '',
  startTime: '20:00',
  endTime: '23:00',
  venue: '',
  city: '',
})

export function EventForm({ open, onClose }: EventFormProps) {
  const events = useEvents()
  const createEvent = useStore((s) => s.createEvent)

  const [form, setForm] = useState(blank)
  const [copyFromId, setCopyFromId] = useState('')
  const [copy, setCopy] = useState<Record<CopyKey, boolean>>({
    materials: true,
    members: true,
    tasks: false,
    slots: false,
    artists: false,
  })

  // Réinitialise à l'ouverture ; pré-sélectionne une source si possible.
  useEffect(() => {
    if (!open) return
    setForm(blank())
    setCopyFromId(events[0]?.id ?? '')
    setCopy({ materials: true, members: true, tasks: false, slots: false, artists: false })
  }, [open, events])

  const set = <K extends keyof ReturnType<typeof blank>>(key: K, value: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = () => {
    const name = form.name.trim()
    if (!name) return
    const anyCopy = copyFromId && Object.values(copy).some(Boolean)
    createEvent(
      {
        kind: form.kind,
        name,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        venue: form.venue.trim(),
        city: form.city.trim(),
      },
      anyCopy ? { copyFromEventId: copyFromId, copy } : undefined,
    )
    onClose()
  }

  const sourceOptions = [
    { value: '', label: '— Partir de zéro —' },
    ...events.map((e) => ({ value: e.id, label: e.data.festival.name || 'Sans nom' })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Nouvel événement"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!form.name.trim()}>
            Créer l'événement
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Type" htmlFor="ev-kind">
            <Select
              id="ev-kind"
              options={toOptions(EVENT_KINDS)}
              value={form.kind}
              onChange={(e) => set('kind', e.target.value as EventKind)}
            />
          </Field>
          <Field label="Nom" htmlFor="ev-name" className="sm:col-span-2">
            <Input
              id="ev-name"
              value={form.name}
              placeholder="Ex. Concert du 21 juin"
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="ev-date">
            <Input id="ev-date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Début" htmlFor="ev-start">
            <Input id="ev-start" type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </Field>
          <Field label="Fin" htmlFor="ev-end">
            <Input id="ev-end" type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lieu" htmlFor="ev-venue">
            <Input id="ev-venue" value={form.venue} placeholder="Salle / parc…" onChange={(e) => set('venue', e.target.value)} />
          </Field>
          <Field label="Ville" htmlFor="ev-city">
            <Input id="ev-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
        </div>

        {/* Réutilisation de données */}
        <div className="rounded-xl border border-night-700 bg-night-900/40 p-4">
          <Field label="Reprendre des données depuis" htmlFor="ev-copy-from" hint="Copie indépendante : modifier l'un n'affecte pas l'autre.">
            <Select
              id="ev-copy-from"
              options={sourceOptions}
              value={copyFromId}
              onChange={(e) => setCopyFromId(e.target.value)}
            />
          </Field>
          {copyFromId && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COPY_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={copy[f.key]}
                    onChange={(e) => setCopy((c) => ({ ...c, [f.key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-night-600 bg-night-850 accent-kessoku-500"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
