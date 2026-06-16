import { useMemo } from 'react'
import { Card, CardBody, CardHeader, Badge } from '@/components/ui'
import { useArtists, useFestival, useMaterials, useMembers, useSlots } from '@/lib/store'
import { SLOT_TYPES, MEMBER_ROLES, MATERIAL_STATUS } from '@/lib/labels'
import { addMinutes, formatDuration, timeToMinutes } from '@/lib/time'
import { formatEUR } from '@/lib/money'
import type { MaterialStatus } from '@/lib/types'
import { DocHeader } from './docShared'

/** Récapitulatif de l'événement : infos, programme, équipe, besoins matériel. */
export function RecapDoc() {
  const festival = useFestival()
  const slots = useSlots()
  const artists = useArtists()
  const members = useMembers()
  const materials = useMaterials()

  const artistName = useMemo(() => {
    const m = new Map(artists.map((a) => [a.id, a.name]))
    return (id?: string) => (id ? m.get(id) ?? '' : '')
  }, [artists])

  const program = useMemo(
    () => [...slots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [slots],
  )

  const mat = useMemo(() => {
    let qty = 0
    let value = 0
    const byStatus = {} as Record<MaterialStatus, number>
    for (const k of Object.keys(MATERIAL_STATUS) as MaterialStatus[]) byStatus[k] = 0
    for (const m of materials) {
      qty += m.qty
      value += m.qty * (m.unitPrice && m.unitPrice > 0 ? m.unitPrice : 0)
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1
    }
    return { qty, value, byStatus, lines: materials.length }
  }, [materials])

  const Info = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-slate-200">{value}</dd>
      </div>
    ) : null

  return (
    <div className="space-y-5">
      <DocHeader title="Récapitulatif de l'événement" festival={festival} />

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Informations</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info label="Horaires" value={`${festival.startTime} – ${festival.endTime}`} />
            <Info label="Accès équipe" value={festival.crewAccessTime} />
            <Info label="Dépose matériel" value={festival.loadInDeadline} />
            <Info label="Lieu" value={festival.venue} />
            <Info label="Ville" value={festival.city} />
            <Info label="Contexte" value={festival.context} />
          </dl>
          {festival.description && <p className="mt-4 text-sm text-slate-300">{festival.description}</p>}
          {festival.notes && <p className="mt-2 text-sm text-slate-400">{festival.notes}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Programme ({program.length})</h2>
        </CardHeader>
        <CardBody className="space-y-1.5">
          {program.map((s) => (
            <div key={s.id} className="flex items-baseline gap-3 border-b border-night-800 pb-1.5">
              <span className="w-28 shrink-0 font-mono text-sm tabular-nums text-slate-300">
                {s.startTime} → {addMinutes(s.startTime, s.durationMin)}
              </span>
              <span className="flex-1 text-sm font-medium text-white">
                {s.title || 'Sans titre'}
                {artistName(s.artistId) && (
                  <span className="font-normal text-slate-400"> — {artistName(s.artistId)}</span>
                )}
              </span>
              <Badge tone={SLOT_TYPES[s.type].badge}>{SLOT_TYPES[s.type].label}</Badge>
              <span className="w-16 shrink-0 text-right text-xs text-slate-500">
                {formatDuration(s.durationMin)}
              </span>
            </div>
          ))}
          {program.length === 0 && <p className="text-sm text-slate-400">Aucun créneau.</p>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Équipe ({members.length})</h2>
          </CardHeader>
          <CardBody className="space-y-1">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-200">{m.name}</span>
                <span className="text-xs text-slate-500">
                  {MEMBER_ROLES[m.role].label}
                  {m.org ? ` · ${m.org}` : ''}
                </span>
              </div>
            ))}
            {members.length === 0 && <p className="text-sm text-slate-400">—</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Besoins matériel</h2>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Articles (quantité)</span>
              <span className="font-semibold text-white">{mat.qty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lignes d'inventaire</span>
              <span className="font-semibold text-white">{mat.lines}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Valeur totale</span>
              <span className="font-semibold text-white">{formatEUR(mat.value)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-night-800 pt-2">
              {(Object.keys(MATERIAL_STATUS) as MaterialStatus[])
                .filter((k) => mat.byStatus[k] > 0)
                .map((k) => (
                  <Badge key={k} tone={MATERIAL_STATUS[k].badge}>
                    {mat.byStatus[k]} {MATERIAL_STATUS[k].label.toLowerCase()}
                  </Badge>
                ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
