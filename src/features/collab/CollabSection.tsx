import { Radio, Users, Wifi, WifiOff } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader } from '@/components/ui'
import { useCollab, type CollabStatus } from '@/lib/collab'

const STATUS: Record<CollabStatus, { label: string; tone: string }> = {
  off: { label: 'Déconnecté', tone: 'bg-night-600 text-slate-300' },
  connecting: { label: 'Connexion…', tone: 'bg-amber-500/15 text-amber-300' },
  online: { label: 'En ligne', tone: 'bg-emerald-500/15 text-emerald-300' },
  error: { label: 'Hors ligne', tone: 'bg-red-500/15 text-red-300' },
}

export function CollabSection() {
  const { status, users, error, connect, disconnect } = useCollab()
  const connected = status === 'online' || status === 'connecting'
  const st = STATUS[status]

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Radio size={18} className="text-kessoku-300" />
          Collaboration
        </h2>
        <Badge tone={st.tone}>{st.label}</Badge>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-xs text-slate-500">
          Les données sont stockées sur le serveur et synchronisées en temps réel entre les membres
          connectés. La connexion est automatique après identification.
        </p>

        {error && status === 'error' && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        {status === 'online' && (
          <div className="rounded-xl border border-night-700 bg-night-900/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users size={15} />
              En ligne ({users.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => (
                <Badge key={u.id} tone="bg-kessoku-500/15 text-kessoku-200">
                  {u.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          {connected ? (
            <Button variant="outline" onClick={disconnect}>
              <WifiOff size={16} />
              Se déconnecter de la synchro
            </Button>
          ) : (
            <Button onClick={connect}>
              <Wifi size={16} />
              Reconnecter
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
