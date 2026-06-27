// Message d'accueil + rattrapage : si des membres rejoignent pendant que le bot
// est hors-ligne (redéploiement…), on les accueille au démarrage suivant.
import type { Client, GuildMember } from 'discord.js'
import { getGuild, setWelcomeWatermark } from '../db.js'
import { fetchEventInfo, welcomeEmbed, type EventInfo } from './event.js'

/** Poste l'accueil d'un membre dans le salon configuré. Renvoie true si envoyé. */
export async function sendWelcome(
  member: GuildMember,
  channelId: string,
  info: EventInfo | null,
): Promise<boolean> {
  const channel = await member.guild.channels.fetch(channelId).catch(() => null)
  if (!channel || !channel.isTextBased() || !('send' in channel)) return false
  await channel.send({ content: `${member}`, embeds: [welcomeEmbed(member, info)] })
  return true
}

const MAX_CATCHUP = 20

/** Au démarrage : accueille les membres arrivés depuis le dernier repère (par guilde). */
export async function runWelcomeCatchup(client: Client): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    const s = getGuild(guild.id)
    if (!s?.welcome_channel_id) continue
    // Premier passage (repère absent) : fenêtre d'1 h pour ne pas accueillir tout le serveur.
    const watermark = s.welcome_last_ts ? Number(s.welcome_last_ts) : Date.now() - 3_600_000
    try {
      const members = await guild.members.fetch()
      const newcomers = [...members.values()]
        .filter((m) => !m.user.bot && m.joinedTimestamp && m.joinedTimestamp > watermark)
        .sort((a, b) => (a.joinedTimestamp ?? 0) - (b.joinedTimestamp ?? 0))

      let maxTs = watermark
      if (newcomers.length === 0) {
        setWelcomeWatermark(guild.id, maxTs)
        continue
      }
      console.log(`[accueil] rattrapage de ${newcomers.length} membre(s) dans ${guild.name}`)
      const info = await fetchEventInfo()
      for (const m of newcomers.slice(0, MAX_CATCHUP)) {
        const ok = await sendWelcome(m, s.welcome_channel_id, info).catch(() => false)
        if (ok && m.joinedTimestamp) maxTs = Math.max(maxTs, m.joinedTimestamp)
        await new Promise((r) => setTimeout(r, 1200)) // anti rate-limit
      }
      if (newcomers.length > MAX_CATCHUP)
        console.warn(`[accueil] ${newcomers.length - MAX_CATCHUP} membre(s) non rattrapés (limite ${MAX_CATCHUP})`)
      setWelcomeWatermark(guild.id, maxTs)
    } catch (err) {
      console.warn(`[accueil] rattrapage échoué (${guild.name}) :`, (err as Error).message)
    }
  }
}
