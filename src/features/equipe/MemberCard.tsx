import { Mail, Phone, Pencil, Trash2, Building2, Handshake } from 'lucide-react'
import { Card, CardBody, Badge, Button, cn } from '@/components/ui'
import { MEMBER_ROLES } from '@/lib/labels'
import type { Member } from '@/lib/types'

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
  const role = MEMBER_ROLES[member.role]
  const hasPhone = member.phone.trim().length > 0
  const hasEmail = member.email.trim().length > 0

  return (
    <Card className="flex h-full flex-col">
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

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={role.badge}>{role.label}</Badge>
          {member.isPartner && (
            <Badge tone="bg-indigo-500/15 text-indigo-300">
              <Handshake size={11} />
              Partenaire
            </Badge>
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
