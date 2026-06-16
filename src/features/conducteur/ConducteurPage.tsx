import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Plus,
  Printer,
  AlignVerticalJustifyStart,
  Clock,
  ListChecks,
  AlertTriangle,
} from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from '@/components/ui'
import { useArtists, useFestival, useSlots, useStore } from '@/lib/store'
import { formatDateFR, formatDuration, minutesToTime, timeToMinutes } from '@/lib/time'
import type { Slot } from '@/lib/types'
import { SlotForm } from './SlotForm'
import { SlotRow, type SlotGap } from './SlotRow'

/** Tri d'affichage : par heure de début, puis par ordre manuel. */
function sortForDisplay(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => {
    const ta = timeToMinutes(a.startTime)
    const tb = timeToMinutes(b.startTime)
    if (ta !== tb && !Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb
    return a.order - b.order
  })
}

export function ConducteurPage() {
  const slots = useSlots()
  const artists = useArtists()
  const festival = useFestival()

  const addSlot = useStore((s) => s.addSlot)
  const updateSlot = useStore((s) => s.updateSlot)
  const removeSlot = useStore((s) => s.removeSlot)
  const recalibrateSlots = useStore((s) => s.recalibrateSlots)

  const [editing, setEditing] = useState<Slot | undefined>(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Slot | undefined>(undefined)

  // Liste ordonnée pour l'affichage et le réordonnancement.
  const ordered = useMemo(() => sortForDisplay(slots), [slots])

  // Map artiste id -> nom (résolution du lien).
  const artistNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of artists) m.set(a.id, a.name || 'Sans nom')
    return m
  }, [artists])

  // Anomalies (chevauchement / trou) entre créneaux consécutifs.
  const gaps = useMemo(() => {
    const m = new Map<string, SlotGap>()
    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1]
      const cur = ordered[i]
      const prevStartMin = timeToMinutes(prev.startTime)
      const curStartMin = timeToMinutes(cur.startTime)
      if (Number.isNaN(prevStartMin) || Number.isNaN(curStartMin)) continue
      const prevDur = Number.isFinite(prev.durationMin) ? prev.durationMin : 0
      const prevEndMin = prevStartMin + prevDur // fin réelle non wrappée
      // overlap > 0 : le créneau démarre avant la fin du précédent.
      const overlapMin = prevEndMin - curStartMin
      if (overlapMin !== 0) m.set(cur.id, { overlapMin })
    }
    return m
  }, [ordered])

  // Indicateurs globaux.
  const totalDuration = useMemo(
    () => slots.reduce((sum, s) => sum + (Number.isFinite(s.durationMin) ? s.durationMin : 0), 0),
    [slots],
  )
  // Heure de fin RÉELLE = fin du dernier créneau (début + durée), et non la somme
  // des durées (qui ignore l'heure de début réelle et les éventuels trous).
  const lastEndMin = useMemo(() => {
    let max = NaN
    for (const s of slots) {
      const start = timeToMinutes(s.startTime)
      if (Number.isNaN(start)) continue
      const end = start + (Number.isFinite(s.durationMin) ? s.durationMin : 0)
      if (Number.isNaN(max) || end > max) max = end
    }
    return max
  }, [slots])
  const computedEnd = Number.isNaN(lastEndMin) ? '—' : minutesToTime(lastEndMin)
  // Dépassement : on compare l'HEURE DE FIN réelle à l'heure de fin prévue.
  const overshootMin = useMemo(() => {
    if (Number.isNaN(lastEndMin)) return 0
    const startMin = timeToMinutes(festival.startTime)
    let endMin = timeToMinutes(festival.endTime)
    if (Number.isNaN(endMin)) return 0
    if (!Number.isNaN(startMin) && endMin < startMin) endMin += 1440 // fin après minuit
    return Math.max(0, lastEndMin - endMin)
  }, [festival.startTime, festival.endTime, lastEndMin])
  const isOvershoot = overshootMin > 0
  const anomalyCount = gaps.size

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (slot: Slot) => {
    setEditing(slot)
    setFormOpen(true)
  }
  const closeForm = () => setFormOpen(false)

  const handleSubmit = (values: Slot) => {
    if (editing) {
      updateSlot(editing.id, {
        title: values.title,
        type: values.type,
        startTime: values.startTime,
        durationMin: values.durationMin,
        artistId: values.artistId,
        stage: values.stage,
        notes: values.notes,
      })
    } else {
      addSlot({
        title: values.title,
        type: values.type,
        startTime: values.startTime,
        durationMin: values.durationMin,
        artistId: values.artistId,
        stage: values.stage,
        notes: values.notes,
      })
    }
    setFormOpen(false)
  }

  // Échange chirurgical du créneau avec son voisin dans l'ORDRE D'AFFICHAGE :
  // on échange startTime ET order des deux créneaux, pour que l'effet soit
  // visible immédiatement (sortForDisplay trie par startTime) sans bouger les autres.
  const move = (id: string, dir: 'up' | 'down') => {
    const ordered = sortForDisplay(slots)
    const idx = ordered.findIndex((s) => s.id === id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return
    const a = ordered[idx]
    const b = ordered[swapIdx]
    updateSlot(a.id, { startTime: b.startTime, order: b.order })
    updateSlot(b.id, { startTime: a.startTime, order: a.order })
  }

  // Recale tous les horaires en chaîne depuis festival.startTime,
  // dans l'ordre d'affichage, en une seule transaction atomique (store).
  const recalibrate = () => recalibrateSlots(festival.startTime)

  const handlePrint = () => window.print()

  return (
    <div>
      {/* En-tête visible uniquement à l'impression : identifie la feuille de route. */}
      <div className="mb-4 hidden border-b border-night-700 pb-3 print:block">
        <h1 className="font-display text-2xl font-bold text-white">
          {festival.name} {festival.edition}
        </h1>
        <p className="mt-0.5 text-sm text-slate-400">
          {[festival.date ? formatDateFR(festival.date) : '', festival.venue, festival.city]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <PageHeader
        title="Conducteur"
        subtitle="Déroulé minute par minute du jour J"
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            {slots.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={recalibrate}>
                  <AlignVerticalJustifyStart size={16} />
                  Recaler les horaires
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer size={16} />
                  Imprimer
                </Button>
              </>
            )}
            <Button size="sm" onClick={openCreate}>
              <Plus size={16} />
              Ajouter un créneau
            </Button>
          </div>
        }
      />

      {slots.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardBody className="flex items-center gap-3 p-3 sm:p-4">
              <span className="rounded-lg bg-night-800 p-2 text-stellar-300">
                <ListChecks size={18} />
              </span>
              <div>
                <p className="text-xs text-slate-500">Créneaux</p>
                <p className="text-lg font-bold text-white">{slots.length}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-3 p-3 sm:p-4">
              <span className="rounded-lg bg-night-800 p-2 text-kessoku-300">
                <Clock size={18} />
              </span>
              <div>
                <p className="text-xs text-slate-500">Durée totale</p>
                <p className="text-lg font-bold text-white">{formatDuration(totalDuration)}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-3 p-3 sm:p-4">
              <span className="rounded-lg bg-night-800 p-2 text-cyan-300">
                <CalendarClock size={18} />
              </span>
              <div>
                <p className="text-xs text-slate-500">Fin calculée</p>
                <p
                  className={
                    isOvershoot ? 'text-lg font-bold text-red-300' : 'text-lg font-bold text-white'
                  }
                >
                  {computedEnd}
                </p>
                <p className="text-[11px] text-slate-500">prévu {festival.endTime}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-3 p-3 sm:p-4">
              <span
                className={
                  anomalyCount > 0
                    ? 'rounded-lg bg-amber-500/10 p-2 text-amber-300'
                    : 'rounded-lg bg-night-800 p-2 text-emerald-300'
                }
              >
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="text-xs text-slate-500">Anomalies</p>
                <p className="text-lg font-bold text-white">{anomalyCount}</p>
                <p className="text-[11px] text-slate-500">trous / chevauchements</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {isOvershoot && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Le déroulé dépasse l'heure de fin prévue ({festival.endTime}) de{' '}
            <strong>{formatDuration(overshootMin)}</strong>. Pensez à ajuster les durées.
          </span>
        </div>
      )}

      {slots.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Aucun créneau"
          description="Construisez le déroulé du jour J en ajoutant vos premiers créneaux (concerts, pauses, technique…)."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} />
              Ajouter un créneau
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {ordered.map((slot, index) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              artistName={slot.artistId ? artistNames.get(slot.artistId) ?? null : null}
              gap={gaps.get(slot.id)}
              isFirst={index === 0}
              isLast={index === ordered.length - 1}
              onEdit={() => openEdit(slot)}
              onRemove={() => setToDelete(slot)}
              onMoveUp={() => move(slot.id, 'up')}
              onMoveDown={() => move(slot.id, 'down')}
            />
          ))}
        </div>
      )}

      <SlotForm
        open={formOpen}
        slot={editing}
        artists={artists}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={toDelete !== undefined}
        title="Supprimer le créneau"
        message={
          toDelete
            ? `Supprimer « ${toDelete.title || 'Sans titre'} » du conducteur ? Cette action est définitive.`
            : ''
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          if (toDelete) removeSlot(toDelete.id)
        }}
        onClose={() => setToDelete(undefined)}
      />
    </div>
  )
}
