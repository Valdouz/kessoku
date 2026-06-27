import type { GuildMember } from 'discord.js'
import { getGuild } from '../db.js'
import { fetchEventInfo, welcomeEmbed } from '../lib/event.js'

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

  // 2) Message d'accueil (si un salon est configuré).
  if (settings?.welcome_channel_id) {
    try {
      const channel = await member.guild.channels.fetch(settings.welcome_channel_id).catch(() => null)
      if (channel && channel.isTextBased()) {
        const info = await fetchEventInfo()
        await channel.send({ content: `${member}`, embeds: [welcomeEmbed(member, info)] })
      }
    } catch (err) {
      console.warn(`[accueil] échec du message pour ${member.user.tag} :`, (err as Error).message)
    }
  }
}
