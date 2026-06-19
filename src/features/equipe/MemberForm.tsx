import { useState, type ChangeEvent } from 'react'
import { Field, Input, Textarea } from '@/components/ui'
import { MEMBER_ROLES, memberRoles, toOptions } from '@/lib/labels'
import type { Member, MemberRole } from '@/lib/types'

const ROLE_OPTIONS = toOptions(MEMBER_ROLES)

export interface MemberFormValues {
  name: string
  roles: MemberRole[]
  org: string
  phone: string
  email: string
  isPartner: boolean
  notes: string
}

/** Extrait les champs éditables d'un membre. */
export function toFormValues(m: Member): MemberFormValues {
  return {
    name: m.name,
    roles: memberRoles(m),
    org: m.org,
    phone: m.phone,
    email: m.email,
    isPartner: m.isPartner,
    notes: m.notes,
  }
}

interface MemberFormProps {
  values: MemberFormValues
  onChange: (patch: Partial<MemberFormValues>) => void
}

export function MemberForm({ values, onChange }: MemberFormProps) {
  // identifiants stables pour relier label <-> champ
  const [ids] = useState(() => {
    const r = Math.random().toString(36).slice(2, 8)
    return {
      name: `mf-name-${r}`,
      role: `mf-role-${r}`,
      org: `mf-org-${r}`,
      phone: `mf-phone-${r}`,
      email: `mf-email-${r}`,
      partner: `mf-partner-${r}`,
      notes: `mf-notes-${r}`,
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

      <div className="sm:col-span-2">
        <span className="field-label">Rôles (plusieurs possibles)</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {ROLE_OPTIONS.map((opt) => {
            const checked = values.roles.includes(opt.value)
            return (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const set = new Set(values.roles)
                    if (e.target.checked) set.add(opt.value)
                    else set.delete(opt.value)
                    onChange({ roles: [...set] })
                  }}
                  className="h-4 w-4 rounded border-night-600 bg-night-850 accent-kessoku-500"
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      </div>

      <Field label="Organisation" htmlFor={ids.org} hint="Association, Mairie, Partenaire…">
        <Input
          id={ids.org}
          value={values.org}
          placeholder="Structure / collectif"
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ org: e.target.value })}
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

      <div className="flex items-center sm:col-span-2">
        <label
          htmlFor={ids.partner}
          className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200"
        >
          <input
            id={ids.partner}
            type="checkbox"
            checked={values.isPartner}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ isPartner: e.target.checked })}
            className="h-4 w-4 cursor-pointer rounded border-night-600 bg-night-800 text-kessoku-500 focus:ring-2 focus:ring-kessoku-500/50"
          />
          Partenaire (structure externe)
        </label>
      </div>

      <Field label="Notes" htmlFor={ids.notes} className="sm:col-span-2">
        <Textarea
          id={ids.notes}
          value={values.notes}
          placeholder="Disponibilités, infos utiles, mission…"
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange({ notes: e.target.value })}
        />
      </Field>
    </div>
  )
}
