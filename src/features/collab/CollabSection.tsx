import { useEffect, useState } from 'react'
import { Radio, Users, Wifi, WifiOff } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input } from '@/components/ui'
import { useCollab, type CollabStatus } from '@/lib/collab'

const STATUS: Record<CollabStatus, { label: string; tone: string }> = {
  off: { label: 'Hors ligne', tone: 'bg-night-600 text-slate-300' },
  connecting: { label: 'Connexion…', tone: 'bg-amber-500/15 text-amber-300' },
  online: { label: 'En ligne', tone: 'bg-emerald-500/15 text-emerald-300' },
  error: { label: 'Erreur', tone: 'bg-red-500/15 text-red-300' },
}

export function CollabSection() {
  const { status, users, config, error, connect, disconnect } = useCollab()
  const [url, setUrl] = useState(config.url)
  const [room, setRoom] = useState(config.room)
  const [name, setName] = useState(config.name)

  // Synchronise les champs si la config change (ex. auto-connexion au démarrage).
  useEffect(() => {
    setUrl(config.url)
    setRoom(config.room)
    setName(config.name)
  }, [config.url, config.room, config.name])

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
          Travaillez à plusieurs en temps réel : partagez le même <strong>code de room</strong> avec la
          régie. Tout reste local-first (ça marche hors-ligne et se resynchronise à la reconnexion).
          Aucune donnée ne transite par un service tiers — le serveur ne fait que relayer.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Votre nom" htmlFor="collab-name">
            <Input
              id="collab-name"
              value={name}
              placeholder="Ex. Akira"
              disabled={connected}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Code de room" htmlFor="collab-room" hint="Choisissez un code commun (secret partagé)">
            <Input
              id="collab-room"
              value={room}
              placeholder="Ex. ma-regie-2026"
              disabled={connected}
              onChange={(e) => setRoom(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Serveur de synchro" htmlFor="collab-url" hint="ws://… ou wss://… (auto-hébergé)">
          <Input
            id="collab-url"
            value={url}
            placeholder="ws://localhost:1234"
            disabled={connected}
            onChange={(e) => setUrl(e.target.value)}
          />
        </Field>

        {error && status === 'error' && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <div className="flex items-center gap-2">
          {connected ? (
            <Button variant="outline" onClick={disconnect}>
              <WifiOff size={16} />
              Se déconnecter
            </Button>
          ) : (
            <Button onClick={() => connect({ url: url.trim(), room: room.trim(), name: name.trim() })}>
              <Wifi size={16} />
              Se connecter
            </Button>
          )}
        </div>

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
      </CardBody>
    </Card>
  )
}
