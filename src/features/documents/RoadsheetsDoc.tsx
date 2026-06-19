import { useMemo, type ReactNode } from 'react'
import { Clock, Volume2, Users, Phone, Mail, Package, ListMusic, Utensils } from 'lucide-react'
import { Badge, cn } from '@/components/ui'
import { useArtists, useFestival, useSlots } from '@/lib/store'
import { ARTIST_KINDS, ARTIST_STATUS } from '@/lib/labels'
import { addMinutes, formatDateFR, formatDuration, timeToMinutes } from '@/lib/time'
import type { Slot } from '@/lib/types'

/** Feuilles de route : une fiche par artiste (horaires, balance, besoins, contacts). */
export function RoadsheetsDoc() {
  const festival = useFestival()
  const artists = useArtists()
  const slots = useSlots()

  // Premier créneau lié à chaque artiste (pour l'horaire de passage).
  const slotByArtist = useMemo(() => {
    const m = new Map<string, Slot>()
    for (const s of slots) if (s.artistId && !m.has(s.artistId)) m.set(s.artistId, s)
    return m
  }, [slots])

  const sorted = useMemo(() => {
    return [...artists].sort((a, b) => {
      const sa = slotByArtist.get(a.id)
      const sb = slotByArtist.get(b.id)
      const ta = sa ? timeToMinutes(sa.startTime) : Number.POSITIVE_INFINITY
      const tb = sb ? timeToMinutes(sb.startTime) : Number.POSITIVE_INFINITY
      if (ta !== tb) return ta - tb
      return a.name.localeCompare(b.name)
    })
  }, [artists, slotByArtist])

  if (artists.length === 0) {
    return <p className="text-sm text-slate-400">Aucun artiste à éditer.</p>
  }

  return (
    <div className="space-y-6">
      {sorted.map((a, i) => {
        const slot = slotByArtist.get(a.id)
        const passage = slot ? `${slot.startTime} → ${addMinutes(slot.startTime, slot.durationMin)}` : '—'
        return (
          <section
            key={a.id}
            className={cn(
              'card p-5 sm:p-6',
              i < sorted.length - 1 && 'break-after-page',
            )}
          >
            <div className="border-b border-night-700 pb-2 text-xs text-slate-500">
              Feuille de route · {festival.name} {festival.edition}
              {festival.date ? ` · ${formatDateFR(festival.date)}` : ''}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{a.name || 'Sans nom'}</h2>
              <Badge tone={ARTIST_KINDS[a.kind].badge}>{ARTIST_KINDS[a.kind].label}</Badge>
              <Badge tone={ARTIST_STATUS[a.status].badge}>{ARTIST_STATUS[a.status].label}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Arrivée" icon={<Clock size={14} />} value={a.arrivalTime || '—'} />
              <Field label="Passage" icon={<Clock size={14} />} value={passage} />
              <Field
                label="Durée"
                value={a.setDurationMin != null ? formatDuration(a.setDurationMin) : '—'}
              />
              <Field label="Balance" icon={<Volume2 size={14} />} value={a.soundcheckTime || '—'} />
              <Field label="Scène" value={slot?.stage || festival.venue || '—'} />
              {a.partySize != null && (
                <Field
                  label="Nb de personnes"
                  icon={<Users size={14} />}
                  value={String(a.partySize)}
                />
              )}
            </div>

            {a.members && (
              <Block label="Composition" icon={<Users size={14} />}>{a.members}</Block>
            )}
            {a.techNeeds && <Block label="Besoins techniques">{a.techNeeds}</Block>}
            {a.backline && <Block label="Backline">{a.backline}</Block>}
            {a.bringing && (
              <Block label="Apporte" icon={<Package size={14} />}>{a.bringing}</Block>
            )}
            {a.setlist && (
              <Block label="Setlist" icon={<ListMusic size={14} />}>{a.setlist}</Block>
            )}
            {a.catering && (
              <Block label="Restauration / loge" icon={<Utensils size={14} />}>{a.catering}</Block>
            )}
            {a.notes && <Block label="Notes">{a.notes}</Block>}

            {(a.contactName || a.contactPhone || a.contactEmail) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-night-700 pt-3 text-sm text-slate-300">
                {a.contactName && <span className="font-medium">{a.contactName}</span>}
                {a.contactPhone && (
                  <span className="inline-flex items-center gap-1.5 text-kessoku-300">
                    <Phone size={14} />
                    {a.contactPhone}
                  </span>
                )}
                {a.contactEmail && (
                  <span className="inline-flex items-center gap-1.5 text-kessoku-300">
                    <Mail size={14} />
                    {a.contactEmail}
                  </span>
                )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function Field({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
        {icon}
        {value}
      </div>
    </div>
  )
}

function Block({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-3">
      <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-300">{children}</p>
    </div>
  )
}
