import type { GuildMember } from 'discord.js'
import { getGuild } from '../db.js'

export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  if (member.user.bot) return
  const settings = getGuild(member.guild.id)
  if (!settings?.autorole_id) return
  try {
    await member.roles.add(settings.autorole_id, 'Autorole Kessoku')
  } catch (err) {
    console.warn(
      `[autorole] échec d'attribution du rôle ${settings.autorole_id} à ${member.user.tag} (${member.guild.name}) :`,
      (err as Error).message,
    )
  }
}
