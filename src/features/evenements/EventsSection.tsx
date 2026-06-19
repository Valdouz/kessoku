import { useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, ConfirmDialog } from '@/components/ui'
import { useEvents, useCurrentEventId, useStore } from '@/lib/store'
import { useAllowedEventIds, usePreview } from '@/lib/auth'
import { EVENT_KINDS } from '@/lib/labels'
import { formatDateFR } from '@/lib/time'
import type { FestivalEvent } from '@/lib/types'
import { EventForm } from './EventForm'

function summary(e: FestivalEvent): string {
  const d = e.data
  return `${d.artists.length} artistes · ${d.materials.length} matériel · ${d.tasks.length} tâches · ${d.members.length} membres`
}

export function EventsSection() {
  const allEvents = useEvents()
  const currentId = useCurrentEventId()
  const switchEvent = useStore((s) => s.switchEvent)
  const duplicateEvent = useStore((s) => s.duplicateEvent)
  const removeEvent = useStore((s) => s.removeEvent)
  const allowed = useAllowedEventIds()
  const preview = usePreview()
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<FestivalEvent | null>(null)

  // En aperçu restreint, on ne liste que les événements visibles par le compte.
  const events = allowed ? allEvents.filter((e) => allowed.has(e.id)) : allEvents

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-white">Événements</h2>
        {!preview && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} />
            Nouvel événement
          </Button>
        )}
      </CardHeader>
      <CardBody className="space-y-2">
        <p className="mb-1 text-xs text-slate-500">
          Gère ici tes concerts et festivals. Crée-en un nouveau (en reprenant des données existantes
          si besoin), bascule de l'un à l'autre, duplique ou supprime.
        </p>
        {events.map((e) => {
          const kind = EVENT_KINDS[e.data.festival.kind]
          const active = e.id === currentId
          return (
            <div
              key={e.id}
              className="flex flex-col gap-3 rounded-xl border border-night-700 bg-night-900/40 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: kind.color }} aria-hidden />
                  <span className="font-semibold text-white">{e.data.festival.name || 'Sans nom'}</span>
                  <Badge tone={kind.badge}>{kind.label}</Badge>
                  {active && <Badge tone="bg-emerald-500/15 text-emerald-300">Actif</Badge>}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {e.data.festival.date ? formatDateFR(e.data.festival.date) : 'Date non définie'} — {summary(e)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!active && (
                  <Button variant="outline" size="sm" onClick={() => switchEvent(e.id)}>
                    Ouvrir
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => duplicateEvent(e.id)} aria-label="Dupliquer">
                  <Copy size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setToDelete(e)}
                  disabled={events.length <= 1}
                  aria-label="Supprimer"
                  className="text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          )
        })}
      </CardBody>

      <EventForm open={formOpen} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer l'événement"
        message={`Supprimer « ${toDelete?.data.festival.name || 'Sans nom'} » et toutes ses données ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={() => toDelete && removeEvent(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </Card>
  )
}
