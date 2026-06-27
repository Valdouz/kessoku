import type {
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
} from 'discord.js'
import { getPanel, listReactionRoles } from '../db.js'
import { normalizeEmoji } from './emoji.js'

/**
 * Applique (ou retire) le rôle correspondant à une réaction sur un panneau.
 * Tolère les objets « partiels » (message/réaction non mis en cache).
 */
export async function applyReactionRole(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  add: boolean,
): Promise<void> {
  if (user.bot) return

  try {
    if (reaction.partial) await reaction.fetch()
    if (reaction.message.partial) await reaction.message.fetch()
  } catch {
    return // message supprimé / inaccessible
  }

  const guild = reaction.message.guild
  if (!guild) return

  const panel = getPanel(reaction.message.id)
  if (!panel) return

  const emoji = normalizeEmoji(reaction.emoji.name)
  const match = listReactionRoles(reaction.message.id).find(
    (r) => normalizeEmoji(r.emoji) === emoji,
  )
  if (!match) return

  try {
    const member = await guild.members.fetch(user.id)
    if (add) await member.roles.add(match.role_id, 'Reaction role Kessoku')
    else await member.roles.remove(match.role_id, 'Reaction role Kessoku')
  } catch (err) {
    console.warn(
      `[reactionrole] échec ${add ? 'ajout' : 'retrait'} du rôle ${match.role_id} ` +
        `pour ${user.id} (${guild.name}) :`,
      (err as Error).message,
    )
  }
}
