// Rappels automatiques : poste un compte à rebours du prochain événement dans le
// salon d'annonces de chaque guilde, à des paliers (J-7, J-3, J-1, jour J), une
// seule fois par palier et par événement (mémorisé dans guild_settings.last_reminder).
import type { Client } from 'discord.js'
import { listAnnounceGuilds, setLastReminder } from '../db.js'
import { fetchEventInfo, announceEmbed, daysUntil } from './event.js'

const MILESTONES = [7, 3, 1, 0] // jours avant l'événement
const CHECK_MS = 3 * 60 * 60 * 1000 // toutes les 3 h

// Palier courant = le plus petit seuil >= jours restants (ex. à J-5 → palier 7).
function currentMilestone(days: number): number | null {
  if (days < 0) return null
  const m = MILESTONES.filter((x) => days <= x).sort((a, b) => a - b)[0]
  return m === undefined ? null : m
}

async function tick(client: Client): Promise<void> {
  const guilds = listAnnounceGuilds()
  if (guilds.length === 0) return
  const info = await fetchEventInfo()
  if (!info) return

  const days = daysUntil(info.date)
  const milestone = currentMilestone(days)
  if (milestone === null) return

  for (const g of guilds) {
    // last_reminder = "<date>:<palier déjà posté>". On ne poste que si on passe à un palier plus serré.
    const [lastDate, lastM] = (g.last_reminder || '').split(':')
    const alreadyPosted = lastDate === info.date ? Number(lastM) : Number.POSITIVE_INFINITY
    if (milestone >= alreadyPosted) continue

    try {
      const channel = await client.channels.fetch(g.announce_channel_id).catch(() => null)
      if (channel && channel.isTextBased() && 'send' in channel) {
        await channel.send({ embeds: [announceEmbed(info)] })
        setLastReminder(g.guild_id, `${info.date}:${milestone}`)
      }
    } catch (err) {
      console.warn(`[annonces] échec dans la guilde ${g.guild_id} :`, (err as Error).message)
    }
  }
}

export function startReminders(client: Client): void {
  void tick(client)
  setInterval(() => void tick(client), CHECK_MS)
}
