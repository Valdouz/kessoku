import { Card, CardBody, CardHeader } from '@/components/ui'
import { useArtists, useFestival, useMembers, useVolunteers } from '@/lib/store'
import { ARTIST_KINDS, ARTIST_STATUS, MEMBER_ROLES, VOLUNTEER_STATUS, memberRoles } from '@/lib/labels'
import { formatDateFR, formatDuration } from '@/lib/time'
import { DocHeader, th, td } from './docShared'

/** Feuille de contacts : artistes + équipe, en tableaux imprimables. */
export function ContactsDoc() {
  const festival = useFestival()
  const artists = useArtists()
  const members = useMembers()
  const volunteers = useVolunteers()

  return (
    <div className="space-y-5">
      <DocHeader title="Feuille de contacts" festival={festival} />

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
                <th className={th}>Statut</th>
                <th className={th}>Set</th>
                <th className={th}>Balance</th>
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
                  <td className={td}>{ARTIST_STATUS[a.status].label}</td>
                  <td className={td}>{a.setDurationMin != null ? formatDuration(a.setDurationMin) : '—'}</td>
                  <td className={td}>{a.soundcheckTime || '—'}</td>
                  <td className={td}>{a.contactName || '—'}</td>
                  <td className={td}>{a.contactPhone || '—'}</td>
                  <td className={td}>{a.contactEmail || '—'}</td>
                </tr>
              ))}
              {artists.length === 0 && (
                <tr>
                  <td className={td} colSpan={8}>
                    Aucun artiste.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Équipe & partenaires ({members.length})</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Nom</th>
                <th className={th}>Rôle</th>
                <th className={th}>Organisation</th>
                <th className={th}>Téléphone</th>
                <th className={th}>Email</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td className={`${td} font-medium text-slate-100`}>{m.name || '—'}</td>
                  <td className={td}>
                    {memberRoles(m).map((r) => MEMBER_ROLES[r].label).join(', ') || '—'}
                  </td>
                  <td className={td}>{m.org || '—'}</td>
                  <td className={td}>{m.phone || '—'}</td>
                  <td className={td}>{m.email || '—'}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td className={td} colSpan={5}>
                    Aucun membre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">Bénévoles ({volunteers.length})</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Nom</th>
                <th className={th}>Poste</th>
                <th className={th}>Disponibilités</th>
                <th className={th}>Statut</th>
                <th className={th}>Repas</th>
                <th className={th}>Téléphone</th>
                <th className={th}>Email</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v) => (
                <tr key={v.id}>
                  <td className={`${td} font-medium text-slate-100`}>{v.name || '—'}</td>
                  <td className={td}>{v.poste || '—'}</td>
                  <td className={td}>{v.availability || '—'}</td>
                  <td className={td}>{VOLUNTEER_STATUS[v.status].label}</td>
                  <td className={td}>{v.mealIncluded ? 'Oui' : '—'}</td>
                  <td className={td}>{v.phone || '—'}</td>
                  <td className={td}>{v.email || '—'}</td>
                </tr>
              ))}
              {volunteers.length === 0 && (
                <tr>
                  <td className={td} colSpan={7}>
                    Aucun bénévole.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <p className="text-xs text-slate-500">Généré le {formatDateFR(new Date().toISOString().slice(0, 10))}.</p>
    </div>
  )
}
