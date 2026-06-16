import { useState } from 'react'
import { ClipboardList, Mic2, Printer, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, PageHeader, cn } from '@/components/ui'
import { RecapDoc } from './RecapDoc'
import { ContactsDoc } from './ContactsDoc'
import { RoadsheetsDoc } from './RoadsheetsDoc'

type DocKey = 'recap' | 'contacts' | 'roadsheets'

const DOCS: { key: DocKey; label: string; desc: string; icon: LucideIcon }[] = [
  { key: 'recap', label: 'Récapitulatif', desc: "Infos, programme, équipe et besoins en une page", icon: ClipboardList },
  { key: 'contacts', label: 'Feuille de contacts', desc: 'Artistes + équipe, en tableaux', icon: Users },
  { key: 'roadsheets', label: 'Feuilles de route artistes', desc: 'Une fiche par artiste (horaires, besoins…)', icon: Mic2 },
]

export function DocumentsPage() {
  const [doc, setDoc] = useState<DocKey>('recap')

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Documents"
          subtitle="Génère et imprime des documents prêts à partager (PDF via l'impression)."
          actions={
            <Button onClick={() => window.print()}>
              <Printer size={18} />
              Imprimer / PDF
            </Button>
          }
        />

        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {DOCS.map(({ key, label, desc, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDoc(key)}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3 text-left transition',
                doc === key
                  ? 'border-kessoku-500/50 bg-kessoku-600/10 ring-1 ring-kessoku-500/30'
                  : 'border-night-700 hover:border-night-600',
              )}
            >
              <Icon size={18} className={doc === key ? 'text-kessoku-300' : 'text-slate-500'} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="block text-xs text-slate-500">{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {doc === 'recap' && <RecapDoc />}
      {doc === 'contacts' && <ContactsDoc />}
      {doc === 'roadsheets' && <RoadsheetsDoc />}
    </div>
  )
}
