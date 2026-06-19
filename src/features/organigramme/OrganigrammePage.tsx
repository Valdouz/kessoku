import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Printer, Users, Handshake, PhoneCall } from 'lucide-react'
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui'
import { useFestival, useMembers } from '@/lib/store'
import { MEMBER_ROLES, memberRoles } from '@/lib/labels'
import type { Member, MemberRole } from '@/lib/types'

// Ordre d'affichage des pôles opérationnels dans l'organigramme.
const POLE_ORDER: MemberRole[] = [
  'artistes',
  'son',
  'communication',
  'logistique',
  'securite',
  'benevole',
  'autre',
]

interface Pole {
  role: MemberRole
  members: Member[]
}

/** Petite carte d'une personne (nom + organisation + rôles). */
function MemberNode({ member, showRole = false }: { member: Member; showRole?: boolean }) {
  const roles = memberRoles(member)
  return (
    <div className="min-w-[150px] rounded-xl border border-night-700 bg-night-850 px-3 py-2 text-center shadow-sm">
      <div className="font-semibold text-white">{member.name || 'Sans nom'}</div>
      {member.org && <div className="text-xs text-slate-400">{member.org}</div>}
      {showRole && roles.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          {roles.map((r) => (
            <Badge key={r} tone={MEMBER_ROLES[r].badge}>
              {MEMBER_ROLES[r].label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/** Trait de liaison vertical entre deux niveaux. */
function Connector() {
  return <div aria-hidden className="mx-auto h-6 w-px bg-night-600" />
}

export function OrganigrammePage() {
  const festival = useFestival()
  const members = useMembers()

  const { coordination, poles, partners, externals } = useMemo(() => {
    const has = (m: Member, r: MemberRole) => memberRoles(m).includes(r)
    const partnerList = members.filter((m) => m.isPartner || has(m, 'partenaire'))
    const partnerIds = new Set(partnerList.map((m) => m.id))
    const externalList = members.filter((m) => !partnerIds.has(m.id) && has(m, 'contact_externe'))
    const externalIds = new Set(externalList.map((m) => m.id))
    const internal = members.filter((m) => !partnerIds.has(m.id) && !externalIds.has(m.id))

    // Un membre apparaît dans CHAQUE pôle correspondant à ses rôles (ex. son + coordination).
    const coord = internal.filter((m) => has(m, 'coordination'))
    const poleList: Pole[] = POLE_ORDER.map((role) => ({
      role,
      members: internal.filter((m) => has(m, role)),
    })).filter((p) => p.members.length > 0)

    return { coordination: coord, poles: poleList, partners: partnerList, externals: externalList }
  }, [members])

  if (members.length === 0) {
    return (
      <div>
        <PageHeader title="Organigramme" subtitle="Généré automatiquement depuis l'équipe" />
        <EmptyState
          icon={Users}
          title="Aucun membre pour l'instant"
          description="Ajoute des personnes dans l'Équipe : l'organigramme se construit tout seul."
          action={
            <Link to="/equipe">
              <Button>Aller à l'Équipe</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Organigramme"
        subtitle="Généré automatiquement depuis l'équipe et les partenaires"
        actions={
          <div className="no-print flex items-center gap-2">
            <Link to="/equipe">
              <Button variant="outline" size="sm">
                <Users size={16} />
                Éditer l'équipe
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimer
            </Button>
          </div>
        }
      />

      <div className="space-y-2">
        {/* Niveau 0 — Festival */}
        <div className="flex justify-center">
          <div className="rounded-2xl border border-kessoku-500/40 bg-gradient-to-br from-kessoku-600/20 to-stellar-600/20 px-5 py-3 text-center shadow-glow">
            <div className="text-lg font-bold text-white">{festival.name}</div>
            {festival.edition && <div className="text-xs text-slate-300">Édition {festival.edition}</div>}
          </div>
        </div>

        {/* Niveau 1 — Coordination */}
        {coordination.length > 0 && (
          <>
            <Connector />
            <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">
              Coordination
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {coordination.map((m) => (
                <MemberNode key={m.id} member={m} />
              ))}
            </div>
          </>
        )}

        {/* Niveau 2 — Pôles opérationnels */}
        {poles.length > 0 && (
          <>
            <Connector />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {poles.map((pole) => {
                const def = MEMBER_ROLES[pole.role]
                return (
                  <div key={pole.role} className="rounded-2xl border border-night-700 bg-night-850/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge tone={def.badge}>{def.label}</Badge>
                      <span className="text-xs text-slate-500">{pole.members.length}</span>
                    </div>
                    <div className="space-y-2">
                      {pole.members.map((m) => (
                        <MemberNode key={m.id} member={m} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Partenaires & contacts externes */}
        {(partners.length > 0 || externals.length > 0) && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {partners.length > 0 && (
              <div className="rounded-2xl border border-indigo-500/30 bg-night-850/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
                  <Handshake size={16} />
                  Partenaires
                </div>
                <div className="flex flex-wrap gap-3">
                  {partners.map((m) => (
                    <MemberNode key={m.id} member={m} showRole />
                  ))}
                </div>
              </div>
            )}
            {externals.length > 0 && (
              <div className="rounded-2xl border border-night-700 bg-night-850/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <PhoneCall size={16} />
                  Contacts externes
                </div>
                <div className="flex flex-wrap gap-3">
                  {externals.map((m) => (
                    <MemberNode key={m.id} member={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
