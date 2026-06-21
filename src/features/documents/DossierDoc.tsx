import { useMemo } from 'react'
import { Card, CardBody, CardHeader, Badge } from '@/components/ui'
import {
  useArtists,
  useFestival,
  useMaterials,
  useMembers,
  useSlots,
  useVolunteers,
} from '@/lib/store'
import {
  SLOT_TYPES,
  ARTIST_KINDS,
  MEMBER_ROLES,
  VOLUNTEER_STATUS,
  memberRoles,
} from '@/lib/labels'
import { addMinutes, formatDuration, timeToMinutes } from '@/lib/time'
import { formatEUR } from '@/lib/money'
import type { MaterialItem, MemberRole } from '@/lib/types'
import { DocHeader, th, td } from './docShared'

const POLE_ORDER: MemberRole[] = [
  'coordination',
  'son',
  'artistes',
  'communication',
  'logistique',
  'securite',
  'contact_externe',
  'autre',
]

/**
 * Dossier complet : un seul document rassemblant infos, programme, contacts,
 * organigramme et le matériel à apporter. Pensé pour être imprimé en PDF.
 */
export function DossierDoc() {
  const festival = useFestival()
  const slots = useSlots()
  const artists = useArtists()
  const members = useMembers()
  const volunteers = useVolunteers()
  const materials = useMaterials()

  const artistName = useMemo(() => {
    const m = new Map(artists.map((a) => [a.id, a.name]))
    return (id?: string) => (id ? m.get(id) ?? '' : '')
  }, [artists])

  const program = useMemo(
    () => [...slots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [slots],
  )

  // Organigramme condensé : membres groupés par rôle (un membre peut apparaître plusieurs fois).
  const orgGroups = useMemo(
    () =>
      POLE_ORDER.map((role) => ({
        role,
        members: members.filter((m) => memberRoles(m).includes(role)),
      })).filter((g) => g.members.length > 0),
    [members],
  )

  // Matériel à APPORTER (ce qu'on emmène), groupé par catégorie + totaux.
  const brought = useMemo(() => {
    const items = materials.filter((m) => m.status === 'a_apporter')
    const byCat = new Map<string, MaterialItem[]>()
    for (const m of items) {
      const arr = byCat.get(m.category) ?? []
      arr.push(m)
      byCat.set(m.category, arr)
    }
    const lineTotal = (m: MaterialItem) =>
      m.unitPrice && m.unitPrice > 0 ? m.qty * m.unitPrice : 0
    const total = items.reduce((s, m) => s + lineTotal(m), 0)
    const qty = items.reduce((s, m) => s + m.qty, 0)
    return {
      categories: [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      total,
      qty,
      count: items.length,
      lineTotal,
    }
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
      <DocHeader title="Dossier complet" festival={festival} />

      {/* Infos */}
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

      {/* Programme */}
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

      {/* Contacts artistes */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Artistes ({artists.length})</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Nom</th>
                <th className={th}>Type</th>
                <th className={th}>Contact</th>
                <th className={th}>Téléphone</th>
                <th className={th}>Email</th>
              </tr>
            </thead>
            <tbody>
              {artists.map((a) => (
                <tr key={a.id}>
                  <td className={`${td} font-medium text-slate-100`}>{a.name || '—'}</td>
                  <td className={td}>{ARTIST_KINDS[a.kind].label}</td>
                  <td className={td}>{a.contactName || '—'}</td>
                  <td className={td}>{a.contactPhone || '—'}</td>
                  <td className={td}>{a.contactEmail || '—'}</td>
                </tr>
              ))}
              {artists.length === 0 && (
                <tr>
                  <td className={td} colSpan={5}>Aucun artiste.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Contacts équipe + bénévoles */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Équipe ({members.length})</h2>
          </CardHeader>
          <CardBody className="space-y-1.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-slate-200">
                  {m.name}
                  {m.phone ? <span className="text-slate-500"> · {m.phone}</span> : ''}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {memberRoles(m).map((r) => MEMBER_ROLES[r].label).join(', ')}
                </span>
              </div>
            ))}
            {members.length === 0 && <p className="text-sm text-slate-400">—</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Bénévoles ({volunteers.length})</h2>
          </CardHeader>
          <CardBody className="space-y-1.5">
            {volunteers.map((v) => (
              <div key={v.id} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-slate-200">
                  {v.name}
                  {v.poste ? <span className="text-slate-500"> · {v.poste}</span> : ''}
                </span>
                <Badge tone={VOLUNTEER_STATUS[v.status].badge}>{VOLUNTEER_STATUS[v.status].label}</Badge>
              </div>
            ))}
            {volunteers.length === 0 && <p className="text-sm text-slate-400">—</p>}
          </CardBody>
        </Card>
      </div>

      {/* Organigramme condensé */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Organigramme</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orgGroups.map(({ role, members: list }) => (
            <div key={role} className="rounded-xl border border-night-700 p-3">
              <Badge tone={MEMBER_ROLES[role].badge}>{MEMBER_ROLES[role].label}</Badge>
              <ul className="mt-2 space-y-0.5 text-sm text-slate-200">
                {list.map((m) => (
                  <li key={m.id}>{m.name || 'Sans nom'}</li>
                ))}
              </ul>
            </div>
          ))}
          {orgGroups.length === 0 && <p className="text-sm text-slate-400">Aucun membre.</p>}
        </CardBody>
      </Card>

      {/* Matériel à apporter */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Matériel à apporter</h2>
          <span className="text-xs text-slate-500">
            {brought.qty} article(s) · {formatEUR(brought.total)}
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          {brought.categories.map(([cat, items]) => (
            <div key={cat}>
              <h3 className="mb-1 text-sm font-semibold text-kessoku-200">{cat}</h3>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id}>
                      <td className={`${td} font-medium text-slate-100`}>{m.name}</td>
                      <td className={`${td} w-12 text-center`}>×{m.qty}</td>
                      <td className={`${td} w-28`}>{m.owner || '—'}</td>
                      <td className={`${td} w-24 text-right`}>
                        {brought.lineTotal(m) > 0 ? formatEUR(brought.lineTotal(m)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {brought.count === 0 && (
            <p className="text-sm text-slate-400">Aucun matériel marqué « à apporter ».</p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
