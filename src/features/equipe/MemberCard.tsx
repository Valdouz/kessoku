import { useState } from 'react'
import { Mail, Phone, Pencil, Trash2, Building2, Handshake, Tags, Check } from 'lucide-react'
import { Card, CardBody, Badge, Button, cn } from '@/components/ui'
import { MEMBER_ROLES, memberRoles, toOptions } from '@/lib/labels'
import { useStore } from '@/lib/store'
import type { Member, MemberRole } from '@/lib/types'

const ROLE_OPTIONS = toOptions(MEMBER_ROLES)

/** Nettoie un numéro pour un lien tel: (garde + et chiffres). */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

/** Lien stylé comme un bouton "outline" taille sm (le UI kit n'a pas de variante <a>). */
const actionLinkClass = cn(
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition',
  'border border-night-600 text-slate-200 hover:border-kessoku-500 hover:text-white',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kessoku-500/40',
)

interface MemberCardProps {
  member: Member
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
}

export function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  const roles = memberRoles(member)
  const updateMember = useStore((s) => s.updateMember)
  const [rolesOpen, setRolesOpen] = useState(false)
  const hasPhone = member.phone.trim().length > 0
  const hasEmail = member.email.trim().length > 0

  const toggleRole = (r: MemberRole) => {
    const set = new Set(roles)
    if (set.has(r)) set.delete(r)
    else set.add(r)
    updateMember(member.id, { roles: [...set] })
  }

  return (
    <Card className={cn('flex h-full flex-col', rolesOpen && 'relative z-40')}>
      <CardBody className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">
              {member.name || 'Sans nom'}
            </h3>
            {member.org && (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400">
                <Building2 size={13} className="shrink-0" />
                <span className="truncate">{member.org}</span>
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Modifier ${member.name || 'le membre'}`}
              onClick={() => onEdit(member)}
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Supprimer ${member.name || 'le membre'}`}
              onClick={() => onDelete(member)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-1.5">
          {roles.map((r) => (
            <Badge key={r} tone={MEMBER_ROLES[r].badge}>
              {MEMBER_ROLES[r].label}
            </Badge>
          ))}
          {member.isPartner && (
            <Badge tone="bg-indigo-500/15 text-indigo-300">
              <Handshake size={11} />
              Partenaire
            </Badge>
          )}
          {/* Affectation rapide des rôles */}
          <button
            type="button"
            onClick={() => setRolesOpen((v) => !v)}
            aria-label="Modifier les rôles"
            className="no-print inline-flex items-center gap-1 rounded-full border border-dashed border-night-600 px-2 py-0.5 text-xs text-slate-400 hover:border-kessoku-500 hover:text-slate-200"
          >
            <Tags size={12} />
            {roles.length === 0 ? 'Rôle' : ''}
          </button>
          {rolesOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setRolesOpen(false)} aria-hidden />
              <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-xl border border-night-700 bg-night-850 p-1 shadow-xl">
                {ROLE_OPTIONS.map((o) => {
                  const checked = roles.includes(o.value)
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleRole(o.value)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-200 hover:bg-night-800"
                    >
                      {o.label}
                      {checked && <Check size={14} className="text-kessoku-300" />}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {(hasPhone || hasEmail) && (
          <div className="flex flex-col gap-1.5 text-sm">
            {hasPhone && (
              <a
                href={telHref(member.phone)}
                className="inline-flex items-center gap-2 text-slate-300 transition hover:text-kessoku-300"
              >
                <Phone size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">{member.phone}</span>
              </a>
            )}
            {hasEmail && (
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-2 text-slate-300 transition hover:text-kessoku-300"
              >
                <Mail size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">{member.email}</span>
              </a>
            )}
          </div>
        )}

        {member.notes && (
          <p className="whitespace-pre-line text-sm text-slate-400">{member.notes}</p>
        )}

        {(hasPhone || hasEmail) && (
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {hasPhone && (
              <a
                href={telHref(member.phone)}
                className={actionLinkClass}
                aria-label={`Appeler ${member.name || 'le membre'}`}
              >
                <Phone size={14} />
                Appeler
              </a>
            )}
            {hasEmail && (
              <a
                href={`mailto:${member.email}`}
                className={actionLinkClass}
                aria-label={`Écrire à ${member.name || 'le membre'}`}
              >
                <Mail size={14} />
                Email
              </a>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
