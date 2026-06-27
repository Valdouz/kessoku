import type { MessageReaction, PartialMessageReaction, User, PartialUser } from 'discord.js'
import { applyReactionRole } from '../lib/reactionRoles.js'

export async function onReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
): Promise<void> {
  await applyReactionRole(reaction, user, true)
}
