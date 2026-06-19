import { Mail, Phone, Pencil, Trash2, Briefcase, CalendarClock, UserCheck, Utensils } from 'lucide-react'
import { Card, CardBody, Badge, Button, cn } from '@/components/ui'
import { VOLUNTEER_STATUS } from '@/lib/labels'
import type { Volunteer } from '@/lib/types'

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

interface VolunteerCardProps {
  volunteer: Volunteer
  onEdit: (volunteer: Volunteer) => void
  onDelete: (volunteer: Volunteer) => void
}

export function VolunteerCard({ volunteer, onEdit, onDelete }: VolunteerCardProps) {
  const status = VOLUNTEER_STATUS[volunteer.status]
  const hasPhone = volunteer.phone.trim().length > 0
  const hasEmail = volunteer.email.trim().length > 0

  return (
    <Card className="flex h-full flex-col">
      <CardBody className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">
              {volunteer.name || 'Sans nom'}
            </h3>
            {volunteer.poste && (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400">
                <Briefcase size={13} className="shrink-0" />
                <span className="truncate">{volunteer.poste}</span>
              </p>
            )}
          </div>
          <div className="no-print flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Modifier ${volunteer.name || 'le bénévole'}`}
              onClick={() => onEdit(volunteer)}
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Supprimer ${volunteer.name || 'le bénévole'}`}
              onClick={() => onDelete(volunteer)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={status.badge}>{status.label}</Badge>
          {volunteer.mealIncluded && (
            <Badge tone="bg-amber-500/15 text-amber-300">
              <Utensils size={11} />
              Repas inclus
            </Badge>
          )}
        </div>

        {(volunteer.availability || volunteer.referent) && (
          <div className="flex flex-col gap-1.5 text-sm text-slate-300">
            {volunteer.availability && (
              <p className="flex items-start gap-2">
                <CalendarClock size={14} className="mt-0.5 shrink-0 text-slate-500" />
                <span className="whitespace-pre-line">{volunteer.availability}</span>
              </p>
            )}
            {volunteer.referent && (
              <p className="flex items-center gap-2">
                <UserCheck size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">Référent : {volunteer.referent}</span>
              </p>
            )}
          </div>
        )}

        {(hasPhone || hasEmail) && (
          <div className="flex flex-col gap-1.5 text-sm">
            {hasPhone && (
              <a
                href={telHref(volunteer.phone)}
                className="inline-flex items-center gap-2 text-slate-300 transition hover:text-kessoku-300"
              >
                <Phone size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">{volunteer.phone}</span>
              </a>
            )}
            {hasEmail && (
              <a
                href={`mailto:${volunteer.email}`}
                className="inline-flex items-center gap-2 text-slate-300 transition hover:text-kessoku-300"
              >
                <Mail size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">{volunteer.email}</span>
              </a>
            )}
          </div>
        )}

        {volunteer.notes && (
          <p className="whitespace-pre-line text-sm text-slate-400">{volunteer.notes}</p>
        )}

        {(hasPhone || hasEmail) && (
          <div className="no-print mt-auto flex flex-wrap gap-2 pt-1">
            {hasPhone && (
              <a
                href={telHref(volunteer.phone)}
                className={actionLinkClass}
                aria-label={`Appeler ${volunteer.name || 'le bénévole'}`}
              >
                <Phone size={14} />
                Appeler
              </a>
            )}
            {hasEmail && (
              <a
                href={`mailto:${volunteer.email}`}
                className={actionLinkClass}
                aria-label={`Écrire à ${volunteer.name || 'le bénévole'}`}
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
