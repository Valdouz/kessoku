import { useEffect, useState } from 'react'
import { Field, Input, Textarea, Select, Modal, Button } from '@/components/ui'
import { ARTIST_KINDS, ARTIST_STATUS, toOptions } from '@/lib/labels'
import { makeArtist } from '@/data/defaults'
import type { Artist, ArtistKind, ArtistStatus } from '@/lib/types'

interface ArtistFormProps {
  open: boolean
  /** Artiste à éditer ; absent => création. */
  artist?: Artist
  onClose: () => void
  onSubmit: (values: Artist) => void
}

/** Modal de création / édition d'une fiche artiste (tous les champs). */
export function ArtistForm({ open, artist, onClose, onSubmit }: ArtistFormProps) {
  const [draft, setDraft] = useState<Artist>(() => artist ?? makeArtist())

  // Réinitialise le brouillon à chaque ouverture / changement de cible.
  useEffect(() => {
    if (open) setDraft(artist ?? makeArtist())
  }, [open, artist])

  const set = <K extends keyof Artist>(key: K, value: Artist[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const canSave = draft.name.trim().length > 0

  const handleSubmit = () => {
    if (!canSave) return
    onSubmit({ ...draft, name: draft.name.trim() })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={artist ? "Modifier l'artiste" : 'Nouvel artiste'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <Field label="Nom de l'artiste / groupe" htmlFor="artist-name">
          <Input
            id="artist-name"
            value={draft.name}
            autoFocus
            placeholder="Ex. Kessoku Band"
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="artist-kind">
            <Select
              id="artist-kind"
              options={toOptions(ARTIST_KINDS)}
              value={draft.kind}
              onChange={(e) => set('kind', e.target.value as ArtistKind)}
            />
          </Field>
          <Field label="Statut" htmlFor="artist-status">
            <Select
              id="artist-status"
              options={toOptions(ARTIST_STATUS)}
              value={draft.status}
              onChange={(e) => set('status', e.target.value as ArtistStatus)}
            />
          </Field>
        </div>

        <Field label="Composition / line-up" htmlFor="artist-members" hint="Membres, instruments…">
          <Input
            id="artist-members"
            value={draft.members}
            placeholder="Ex. 4 musiciens : guitare, basse, batterie, chant"
            onChange={(e) => set('members', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Contact" htmlFor="artist-contact-name">
            <Input
              id="artist-contact-name"
              value={draft.contactName}
              placeholder="Nom du référent"
              onChange={(e) => set('contactName', e.target.value)}
            />
          </Field>
          <Field label="Téléphone" htmlFor="artist-contact-phone">
            <Input
              id="artist-contact-phone"
              type="tel"
              value={draft.contactPhone}
              placeholder="06 12 34 56 78"
              onChange={(e) => set('contactPhone', e.target.value)}
            />
          </Field>
          <Field label="E-mail" htmlFor="artist-contact-email">
            <Input
              id="artist-contact-email"
              type="email"
              value={draft.contactEmail}
              placeholder="contact@exemple.fr"
              onChange={(e) => set('contactEmail', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Réseaux / liens" htmlFor="artist-social">
          <Input
            id="artist-social"
            value={draft.social}
            placeholder="Instagram, Bandcamp, site…"
            onChange={(e) => set('social', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Durée du set (min)" htmlFor="artist-duration" hint="Laisser vide si inconnu">
            <Input
              id="artist-duration"
              type="number"
              min={0}
              inputMode="numeric"
              value={draft.setDurationMin ?? ''}
              placeholder="Ex. 30"
              onChange={(e) =>
                set('setDurationMin', e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Heure de balance" htmlFor="artist-soundcheck">
            <Input
              id="artist-soundcheck"
              type="time"
              value={draft.soundcheckTime}
              onChange={(e) => set('soundcheckTime', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Besoins techniques" htmlFor="artist-tech" hint="Patch, input list, demandes plateau…">
          <Textarea
            id="artist-tech"
            value={draft.techNeeds}
            placeholder="Ex. 2 micros chant, 1 DI basse, 4 retours…"
            onChange={(e) => set('techNeeds', e.target.value)}
          />
        </Field>

        <Field label="Backline" htmlFor="artist-backline" hint="Matériel apporté / demandé">
          <Textarea
            id="artist-backline"
            value={draft.backline}
            placeholder="Ex. ampli guitare fourni, batterie à prévoir…"
            onChange={(e) => set('backline', e.target.value)}
          />
        </Field>

        <Field label="Notes" htmlFor="artist-notes">
          <Textarea
            id="artist-notes"
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
