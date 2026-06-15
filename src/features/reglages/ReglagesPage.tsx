import { PageHeader } from '@/components/ui'
import { AccountSection } from '@/features/auth/AccountSection'
import { UsersSection } from '@/features/auth/UsersSection'
import { EventsSection } from '@/features/evenements/EventsSection'
import { CollabSection } from '@/features/collab/CollabSection'
import { useAuth } from '@/lib/auth'
import { FestivalForm } from './FestivalForm'
import { DataSection } from './DataSection'
import { AboutSection } from './AboutSection'

export function ReglagesPage() {
  const isAdmin = useAuth((s) => s.user?.role === 'admin')

  return (
    <div>
      <PageHeader
        title="Réglages"
        subtitle="Compte, comptes de l'équipe, événements, données et collaboration."
      />

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AccountSection />
        {isAdmin && <UsersSection />}
      </div>

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
