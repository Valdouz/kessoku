import type { GuildMember } from 'discord.js'
import { getGuild, setWelcomeWatermark } from '../db.js'
import { fetchEventInfo } from '../lib/event.js'
import { sendWelcome } from '../lib/welcome.js'

export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  if (member.user.bot) return
  const settings = getGuild(member.guild.id)

  // 1) Autorole à l'arrivée.
  if (settings?.autorole_id) {
    try {
      await member.roles.add(settings.autorole_id, 'Autorole Kessoku')
    } catch (err) {
      console.warn(
        `[autorole] échec d'attribution du rôle ${settings.autorole_id} à ${member.user.tag} (${member.guild.name}) :`,
        (err as Error).message,
      )
    }
  }

  // 2) Message d'accueil (si un salon est configuré). On n'avance le repère qu'en
  //    cas de succès : sinon le rattrapage au prochain démarrage réessaiera.
  if (settings?.welcome_channel_id) {
    try {
      const info = await fetchEventInfo()
      const ok = await sendWelcome(member, settings.welcome_channel_id, info)
      if (ok && member.joinedTimestamp) setWelcomeWatermark(member.guild.id, member.joinedTimestamp)
    } catch (err) {
      console.warn(`[accueil] échec du message pour ${member.user.tag} :`, (err as Error).message)
    }
  }
}
