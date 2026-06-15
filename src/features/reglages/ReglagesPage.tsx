import { PageHeader } from '@/components/ui'
import { EventsSection } from '@/features/evenements/EventsSection'
import { CollabSection } from '@/features/collab/CollabSection'
import { FestivalForm } from './FestivalForm'
import { DataSection } from './DataSection'
import { AboutSection } from './AboutSection'

export function ReglagesPage() {
  return (
    <div>
      <PageHeader
        title="Réglages"
        subtitle="Événements, infos de l'événement courant, sauvegarde des données et à propos."
      />

      <div className="mb-5">
        <EventsSection />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5 lg:col-span-1">
          <FestivalForm />
        </div>
        <div className="space-y-5 lg:col-span-1">
          <CollabSection />
          <DataSection />
          <AboutSection />
        </div>
      </div>
    </div>
  )
}
