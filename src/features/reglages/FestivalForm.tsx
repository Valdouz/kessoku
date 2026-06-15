import { Card, CardBody, CardHeader, Field, Input, Select, Textarea } from '@/components/ui'
import { useFestival, useStore } from '@/lib/store'
import { EVENT_KINDS, toOptions } from '@/lib/labels'
import type { EventKind, Festival } from '@/lib/types'

/**
 * Formulaire d'édition du festival (entité singleton).
 * Édition directe sur le store : chaque champ est contrôlé par useFestival()
 * et persisté à la frappe via updateFestival. Pas d'état local miroir, donc
 * aucune resynchronisation ne peut écraser une saisie en cours (cf. perte de
 * saisie de l'ancienne version à state miroir + useEffect de resync).
 */
export function FestivalForm() {
  const festival = useFestival()
  const updateFestival = useStore((s) => s.updateFestival)

  const set =
    <K extends keyof Festival>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      updateFestival({ [key]: e.target.value } as Partial<Festival>)

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-white">Événement courant</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <Field label="Type d'événement" htmlFor="fest-kind" className="sm:max-w-xs">
          <Select
            id="fest-kind"
            options={toOptions(EVENT_KINDS)}
            value={festival.kind}
            onChange={(e) => updateFestival({ kind: e.target.value as EventKind })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" htmlFor="fest-name">
            <Input
              id="fest-name"
              value={festival.name}
              onChange={set('name')}
              placeholder="Mon festival"
            />
          </Field>
          <Field label="Édition" htmlFor="fest-edition">
            <Input
              id="fest-edition"
              value={festival.edition}
              onChange={set('edition')}
              placeholder="2026"
            />
          </Field>
        </div>

        <Field label="Date" htmlFor="fest-date">
          <Input id="fest-date" type="date" value={festival.date} onChange={set('date')} />
        </Field>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field label="Début" htmlFor="fest-start">
            <Input
              id="fest-start"
              type="time"
              value={festival.startTime}
              onChange={set('startTime')}
            />
          </Field>
          <Field label="Fin" htmlFor="fest-end">
            <Input id="fest-end" type="time" value={festival.endTime} onChange={set('endTime')} />
          </Field>
          <Field label="Accès équipe" htmlFor="fest-crew" hint="Arrivée équipe/artistes">
            <Input
              id="fest-crew"
              type="time"
              value={festival.crewAccessTime}
              onChange={set('crewAccessTime')}
            />
          </Field>
          <Field label="Dépose matériel" htmlFor="fest-loadin" hint="Avant cette heure">
            <Input
              id="fest-loadin"
              type="time"
              value={festival.loadInDeadline}
              onChange={set('loadInDeadline')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lieu" htmlFor="fest-venue">
            <Input
              id="fest-venue"
              value={festival.venue}
              onChange={set('venue')}
              placeholder="Parc / salle…"
            />
          </Field>
          <Field label="Ville" htmlFor="fest-city">
            <Input
              id="fest-city"
              value={festival.city}
              onChange={set('city')}
              placeholder="Ma ville"
            />
          </Field>
        </div>

        <Field label="Contexte" htmlFor="fest-context" hint="Cadre / événement parent">
          <Input
            id="fest-context"
            value={festival.context}
            onChange={set('context')}
            placeholder="Programmation estivale"
          />
        </Field>

        <Field label="Description" htmlFor="fest-description">
          <Textarea
            id="fest-description"
            value={festival.description}
            onChange={set('description')}
            rows={3}
          />
        </Field>

        <Field label="Notes internes" htmlFor="fest-notes">
          <Textarea
            id="fest-notes"
            value={festival.notes}
            onChange={set('notes')}
            rows={3}
          />
        </Field>
      </CardBody>
    </Card>
  )
}
