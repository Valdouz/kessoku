import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload, AlertTriangle } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
} from '@/components/ui'
import { useFestival, useStore } from '@/lib/store'
import { downloadJSON, exportFilename, parseImport } from '@/lib/io'
import { BRAND } from '@/brand'
import type { AppData } from '@/lib/types'

/**
 * Sauvegarde & partage des données : export JSON (envoi à la régie en
 * attendant la sync temps réel), import JSON, et réinitialisation aux
 * données d'exemple.
 */
export function DataSection() {
  const festival = useFestival()
  const replaceData = useStore((s) => s.replaceData)
  const resetData = useStore((s) => s.resetData)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<AppData | null>(null)
  const [pendingName, setPendingName] = useState('')
  const [importError, setImportError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)

  const handleExport = () => {
    const file = useStore.getState().exportFile()
    downloadJSON(file, exportFilename(festival.name))
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // On réinitialise l'input pour pouvoir réimporter le même fichier ensuite.
    e.target.value = ''
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const data = parseImport(text)
      setPending(data)
      setPendingName(file.name)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import impossible.')
    }
  }

  const confirmImport = () => {
    if (pending) replaceData(pending)
    setPending(null)
    setPendingName('')
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-white">Données</h2>
      </CardHeader>
      <CardBody className="space-y-5">
        {/* Export */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-200">Sauvegarder &amp; partager</p>
          <p className="text-xs text-slate-400">
            Exporte toutes les données dans un fichier <code className="text-kessoku-200">.json</code>.
            C'est le moyen actuel de partager avec la régie (en attendant la synchronisation temps
            réel).
          </p>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={15} />
            Exporter (.json)
          </Button>
        </div>

        <div className="h-px bg-night-700" />

        {/* Import */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-200">Importer un fichier</p>
          <p className="text-xs text-slate-400">
            Charge un <code className="text-kessoku-200">.json</code> exporté depuis {BRAND.name}.
            <span className="text-amber-300"> Toutes les données actuelles seront remplacées.</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
            aria-hidden="true"
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} />
            Importer (.json)
          </Button>
          {importError && (
            <p className="flex items-start gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              {importError}
            </p>
          )}
        </div>

        <div className="h-px bg-night-700" />

        {/* Reset */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-200">Réinitialiser</p>
          <p className="text-xs text-slate-400">
            Restaure les données d'exemple fournies avec l'application. Action irréversible.
          </p>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw size={15} />
            Réinitialiser aux données d'exemple
          </Button>
        </div>
      </CardBody>

      <ConfirmDialog
        open={pending !== null}
        title="Remplacer toutes les données ?"
        message={`Importer « ${pendingName} » écrasera l'intégralité des données actuelles (festival, conducteur, artistes, matériel, tâches, équipe). Cette action est irréversible.`}
        confirmLabel="Remplacer"
        danger
        onConfirm={confirmImport}
        onClose={() => {
          setPending(null)
          setPendingName('')
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Réinitialiser ?"
        message="Toutes les données actuelles seront remplacées par les données d'exemple. Pensez à exporter d'abord si vous voulez les conserver."
        confirmLabel="Réinitialiser"
        danger
        onConfirm={resetData}
        onClose={() => setResetOpen(false)}
      />
    </Card>
  )
}
