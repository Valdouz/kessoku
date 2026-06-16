import {
  Clock,
  Mail,
  Music2,
  Pencil,
  Phone,
  Trash2,
  Users,
  Volume2,
} from 'lucide-react'
import { Card, CardBody, Badge, Button, Select } from '@/components/ui'
import { ARTIST_KINDS, ARTIST_STATUS, toOptions } from '@/lib/labels'
import { formatDuration } from '@/lib/time'
import type { Artist, ArtistStatus } from '@/lib/types'

interface ArtistCardProps {
  artist: Artist
  onEdit: (artist: Artist) => void
  onDelete: (artist: Artist) => void
  onStatusChange: (id: string, status: ArtistStatus) => void
}

/** Carte de détail d'un artiste : infos, contact, besoins, statut rapide. */
export function ArtistCard({ artist, onEdit, onDelete, onStatusChange }: ArtistCardProps) {
  const kind = ARTIST_KINDS[artist.kind]

  return (
    <Card className="flex h-full flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        {/* En-tête : nom + badges + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">{artist.name}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone={kind.badge}>{kind.label}</Badge>
              <Badge tone={ARTIST_STATUS[artist.status].badge}>
                {ARTIST_STATUS[artist.status].label}
              </Badge>
            </div>
          </div>
          <div className="no-print flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Modifier ${artist.name}`}
              onClick={() => onEdit(artist)}
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Supprimer ${artist.name}`}
              onClick={() => onDelete(artist)}
            >
              <Trash2 size={16} className="text-red-300" />
            </Button>
          </div>
        </div>

        {/* Set / balance */}
        {(artist.setDurationMin != null || artist.soundcheckTime) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
            {artist.setDurationMin != null && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-stellar-400" />
                Set {formatDuration(artist.setDurationMin)}
              </span>
            )}
            {artist.soundcheckTime && (
              <span className="inline-flex items-center gap-1.5">
                <Volume2 size={14} className="text-cyan-300" />
                Balance {artist.soundcheckTime}
              </span>
            )}
          </div>
        )}

        {/* Composition */}
        {artist.members && (
          <p className="inline-flex items-start gap-1.5 text-sm text-slate-400">
            <Users size={14} className="mt-0.5 shrink-0 text-slate-500" />
            <span className="min-w-0">{artist.members}</span>
          </p>
        )}

        {/* Contact */}
        {(artist.contactName || artist.contactPhone || artist.contactEmail) && (
          <div className="space-y-1 text-sm">
            {artist.contactName && <p className="text-slate-300">{artist.contactName}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {artist.contactPhone && (
                <a
                  href={`tel:${artist.contactPhone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-kessoku-300 hover:text-kessoku-200"
                >
                  <Phone size={14} />
                  {artist.contactPhone}
                </a>
              )}
              {artist.contactEmail && (
                <a
                  href={`mailto:${artist.contactEmail}`}
                  className="inline-flex items-center gap-1.5 truncate text-kessoku-300 hover:text-kessoku-200"
                >
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{artist.contactEmail}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Réseaux */}
        {artist.social && (
          <p className="inline-flex items-center gap-1.5 text-sm text-slate-400">
            <Music2 size={14} className="shrink-0 text-stellar-400" />
            <span className="min-w-0 break-words">{artist.social}</span>
          </p>
        )}

        {/* Besoins techniques / backline / notes */}
        {(artist.techNeeds || artist.backline || artist.notes) && (
          <dl className="space-y-2 border-t border-night-700 pt-3 text-sm">
            {artist.techNeeds && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Besoins techniques
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-300">{artist.techNeeds}</dd>
              </div>
            )}
            {artist.backline && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Backline
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-300">{artist.backline}</dd>
              </div>
            )}
            {artist.notes && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-400">{artist.notes}</dd>
              </div>
            )}
          </dl>
        )}

        {/* Changement rapide de statut (poussé en bas de carte) */}
        <div className="no-print mt-auto flex items-center gap-2 border-t border-night-700 pt-3">
          <label
            htmlFor={`status-${artist.id}`}
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Statut
          </label>
          <Select
            id={`status-${artist.id}`}
            className="h-8 flex-1 text-xs"
            options={toOptions(ARTIST_STATUS)}
            value={artist.status}
            onChange={(e) => onStatusChange(artist.id, e.target.value as ArtistStatus)}
            aria-label={`Changer le statut de ${artist.name}`}
          />
        </div>
      </CardBody>
    </Card>
  )
}
