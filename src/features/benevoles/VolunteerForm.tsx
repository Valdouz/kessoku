import { useState, type ChangeEvent } from 'react'
import { Field, Input, Textarea, Select } from '@/components/ui'
import { VOLUNTEER_STATUS, toOptions } from '@/lib/labels'
import type { Volunteer, VolunteerStatus } from '@/lib/types'

const STATUS_OPTIONS = toOptions(VOLUNTEER_STATUS)

export interface VolunteerFormValues {
  name: string
  poste: string
  availability: string
  status: VolunteerStatus
  phone: string
  email: string
  referent: string
  mealIncluded: boolean
  notes: string
}

/** Extrait les champs éditables d'un bénévole. */
export function toFormValues(v: Volunteer): VolunteerFormValues {
  return {
    name: v.name,
    poste: v.poste,
    availability: v.availability,
    status: v.status,
    phone: v.phone,
    email: v.email,
    referent: v.referent,
    mealIncluded: v.mealIncluded,
    notes: v.notes,
  }
}

interface VolunteerFormProps {
  values: VolunteerFormValues
  onChange: (patch: Partial<VolunteerFormValues>) => void
}

export function VolunteerForm({ values, onChange }: VolunteerFormProps) {
  // identifiants stables pour relier label <-> champ
  const [ids] = useState(() => {
    const r = Math.random().toString(36).slice(2, 8)
    return {
      name: `vf-name-${r}`,
      poste: `vf-poste-${r}`,
      availability: `vf-avail-${r}`,
      status: `vf-status-${r}`,
      phone: `vf-phone-${r}`,
      email: `vf-email-${r}`,
      referent: `vf-referent-${r}`,
      meal: `vf-meal-${r}`,
      notes: `vf-notes-${r}`,
    }
  })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Nom" htmlFor={ids.name} className="sm:col-span-2">
        <Input
          id={ids.name}
          value={values.name}
          placeholder="Prénom Nom"
          autoFocus
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ name: e.target.value })}
        />
      </Field>

      <Field label="Poste / mission" htmlFor={ids.poste}>
        <Input
          id={ids.poste}
          value={values.poste}
          placeholder="Bar, accueil, technique…"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ poste: e.target.value })}
        />
      </Field>

      <Field label="Statut" htmlFor={ids.status}>
        <Select
          id={ids.status}
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onChange({ status: e.target.value as VolunteerStatus })
          }
        />
      </Field>

      <Field
        label="Disponibilités"
        htmlFor={ids.availability}
        hint="Créneaux ou jours de présence"
        className="sm:col-span-2"
      >
        <Textarea
          id={ids.availability}
          value={values.availability}
          placeholder="Ven. soir, sam. journée…"
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onChange({ availability: e.target.value })
          }
        />
      </Field>

      <Field label="Téléphone" htmlFor={ids.phone}>
        <Input
          id={ids.phone}
          type="tel"
          inputMode="tel"
          value={values.phone}
          placeholder="06 12 34 56 78"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ phone: e.target.value })}
        />
      </Field>

      <Field label="Email" htmlFor={ids.email}>
        <Input
          id={ids.email}
          type="email"
          inputMode="email"
          value={values.email}
          placeholder="nom@exemple.fr"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ email: e.target.value })}
        />
      </Field>

      <Field label="Référent" htmlFor={ids.referent} hint="Responsable encadrant">
        <Input
          id={ids.referent}
          value={values.referent}
          placeholder="Nom du référent"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ referent: e.target.value })}
        />
      </Field>

      <div className="flex items-center">
        <label
          htmlFor={ids.meal}
          className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200"
        >
          <input
            id={ids.meal}
            type="checkbox"
            checked={values.mealIncluded}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange({ mealIncluded: e.target.checked })
            }
            className="h-4 w-4 cursor-pointer rounded border-night-600 bg-night-800 text-kessoku-500 focus:ring-2 focus:ring-kessoku-500/50"
          />
          Repas inclus
        </label>
      </div>

      <Field label="Notes" htmlFor={ids.notes} className="sm:col-span-2">
        <Textarea
          id={ids.notes}
          value={values.notes}
          placeholder="Infos utiles, contraintes, compétences…"
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange({ notes: e.target.value })}
        />
      </Field>
    </div>
  )
}
