import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  MapPin,
  User,
  AlertTriangle,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { SLOT_TYPES } from '@/lib/labels'
import { addMinutes, formatDuration } from '@/lib/time'
import type { Slot } from '@/lib/types'

/** Écart entre la fin du créneau précédent et le début de celui-ci. */
export interface SlotGap {
  /** minutes de chevauchement (négatif = trou). 0 = enchaînement parfait. */
  overlapMin: number
}

interface SlotRowProps {
  slot: Slot
  /** Nom de l'artiste résolu (ou null si aucun / introuvable). */
  artistName: string | null
  /** Anomalie avec le créneau précédent (chevauchement ou trou). */
  gap?: SlotGap
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function SlotRow({
  slot,
  artistName,
  gap,
  isFirst,
  isLast,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SlotRowProps) {
  const def = SLOT_TYPES[slot.type]
  const endTime = addMinutes(slot.startTime, slot.durationMin)

  const gapLabel =
    gap && gap.overlapMin !== 0
      ? gap.overlapMin > 0
        ? `Chevauchement de ${formatDuration(gap.overlapMin)} avec le créneau précédent`
        : `Trou de ${formatDuration(-gap.overlapMin)} avant ce créneau`
      : null

  return (
    <div>
      {gapLabel && (
        <div className="mb-1.5 flex items-center gap-1.5 pl-3 text-xs text-amber-300/90">
          <AlertTriangle size={13} className="shrink-0" />
          <span>{gapLabel}</span>
        </div>
      )}

      <div className="flex items-stretch gap-3 rounded-xl border border-night-700 bg-night-850/60 p-3 sm:p-4">
        {/* Barre colorée selon le type */}
        <span
          aria-hidden="true"
          className="w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: def.color }}
        />

        {/* Horaire */}
        <div className="flex w-16 shrink-0 flex-col justify-center text-center sm:w-20">
          <span className="text-base font-bold tabular-nums text-white sm:text-lg">
            {slot.startTime}
          </span>
          <span className="text-[11px] tabular-nums text-slate-500">→ {endTime}</span>
        </div>

        {/* Contenu */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-sm font-semibold text-slate-100 sm:text-base">
              {slot.title || 'Sans titre'}
            </h3>
            <Badge tone={def.badge}>{def.label}</Badge>
            <span className="text-xs text-slate-500">{formatDuration(slot.durationMin)}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            {slot.stage && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} className="shrink-0 text-slate-500" />
                {slot.stage}
              </span>
            )}
            {artistName && (
              <span className="inline-flex items-center gap-1 text-stellar-300">
                <User size={12} className="shrink-0" />
                {artistName}
              </span>
            )}
          </div>

          {slot.notes && (
            <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-500">{slot.notes}</p>
          )}
        </div>

        {/* Contrôles (masqués à l'impression) */}
        <div className="no-print flex shrink-0 flex-col items-center gap-1">
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Monter le créneau"
            >
              <ChevronUp size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Descendre le créneau"
            >
              <ChevronDown size={16} />
            </Button>
          </div>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onEdit}
              aria-label="Modifier le créneau"
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-300 hover:bg-red-500/10"
              onClick={onRemove}
              aria-label="Supprimer le créneau"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
