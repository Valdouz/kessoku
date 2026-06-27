// Statut du bot : compte à rebours du prochain événement ("dans X jours / X heures").
// Source : API du site si configurée, sinon variables d'env (NEXT_EVENT_NAME/DATE).
import { ActivityType, type Client } from 'discord.js'
import { siteApi, siteApiConfigured } from './siteApi.js'

interface NextEvent {
  name: string
  date: string // ISO (YYYY-MM-DD ou complet)
}

async function getNextEvent(): Promise<NextEvent | null> {
  if (siteApiConfigured()) {
    try {
      const ev = await siteApi<NextEvent | null>('/api/next-event')
      if (ev && ev.date) return ev
    } catch {
      /* repli sur l'env */
    }
  }
  const date = process.env.NEXT_EVENT_DATE
  if (date) return { name: process.env.NEXT_EVENT_NAME ?? '', date }
  return null
}

/** "Festival dans 14 jours" / "Concert dans 6 heures" / "… c'est aujourd'hui !" */
export function formatCountdown(name: string, dateISO: string): string | null {
  const target = new Date(dateISO + (dateISO.length <= 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const label = name?.trim() || "l'événement"
  const ms = target.getTime() - now.getTime()
  if (ms <= 0) {
    return target.toDateString() === now.toDateString() ? `${label}, c'est aujourd'hui ! 🎉` : null
  }
  const days = Math.floor(ms / 86_400_000)
  if (days >= 1) return `${label} dans ${days} jour${days > 1 ? 's' : ''}`
  const hours = Math.max(1, Math.ceil(ms / 3_600_000))
  return `${label} dans ${hours} heure${hours > 1 ? 's' : ''}`
}

const REFRESH_MS = 10 * 60 * 1000

export function startPresence(client: Client<true>): void {
  const update = async () => {
    const ev = await getNextEvent().catch(() => null)
    const text = ev ? formatCountdown(ev.name, ev.date) : null
    const status = text ? `🎪 ${text}` : '🎶 Kessoku · régie'
    client.user.setPresence({
      activities: [{ name: status, state: status, type: ActivityType.Custom }],
      status: 'online',
    })
  }
  void update()
  setInterval(() => void update(), REFRESH_MS)
}
