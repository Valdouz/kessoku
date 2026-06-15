import { ExternalLink, Github, Mail, Users } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui'
import { BRAND } from '@/brand'
import { SCHEMA_VERSION } from '@/lib/store'

const APP_VERSION = '0.1.0'

/** « À propos » + encart Collaboration (local-first / sync à venir). */
export function AboutSection() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-white">À propos</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-xl bg-kessoku-500/15 text-2xl text-kessoku-200"
              aria-hidden="true"
            >
              {BRAND.kanji}
            </span>
            <div>
              <p className="text-lg font-semibold text-white">
                {BRAND.name}{' '}
                <span className="text-sm font-normal text-slate-400">{BRAND.kanji}</span>
              </p>
              <p className="text-sm text-slate-400">{BRAND.tagline}</p>
            </div>
          </div>

          <p className="rounded-xl border border-night-700 bg-night-850/60 p-3 text-sm leading-relaxed text-slate-300">
            {BRAND.about}
          </p>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3 border-b border-night-700/60 py-1.5">
              <dt className="text-slate-400">Version</dt>
              <dd className="text-slate-200">
                {APP_VERSION}{' '}
                <span className="text-slate-500">(schéma v{SCHEMA_VERSION})</span>
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-night-700/60 py-1.5">
              <dt className="text-slate-400">Auteur</dt>
              <dd className="text-slate-200">{BRAND.author}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a
              href={`mailto:${BRAND.contact}`}
              className="inline-flex items-center gap-1.5 text-kessoku-200 hover:text-kessoku-100"
            >
              <Mail size={14} />
              {BRAND.contact}
            </a>
            <a
              href={BRAND.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-stellar-400 hover:text-stellar-300"
            >
              <Github size={14} />
              Code source
              <ExternalLink size={12} />
            </a>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Users size={16} className="text-stellar-400" />
            Collaboration
          </h2>
        </CardHeader>
        <CardBody className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            {BRAND.name} est <span className="font-medium text-white">local-first</span> : toutes les
            données restent dans votre navigateur, rien n'est envoyé sur un serveur. L'app fonctionne
            donc entièrement hors-ligne.
          </p>
          <p>
            La <span className="font-medium text-white">synchronisation temps réel</span>{' '}
            multi-utilisateurs (toute la régie sur les mêmes données) est prévue — le socle technique
            est déjà en place (cf. <code className="text-kessoku-200">src/lib/sync.ts</code>).
          </p>
          <p className="rounded-xl border border-stellar-500/30 bg-stellar-500/10 p-3 text-stellar-200">
            En attendant, partagez vos données via <span className="font-medium">l'export / import
            JSON</span> de la section « Données » : exportez un fichier et envoyez-le à l'équipe, qui
            l'importe de son côté.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
