import { MessageFlags, type Collection, type Interaction, type InteractionReplyOptions } from 'discord.js'
import type { Command } from '../lib/command.js'
import { handleAutoroleSelect, SELECT_ID } from '../commands/autorole.js'
import {
  handleReactionCreateSelect,
  handleReactionAddSelect,
  handleReactionRemoveSelect,
  CREATE_PREFIX,
  ADD_PREFIX,
  REMOVE_PREFIX,
} from '../commands/reactionrole.js'

export async function onInteraction(
  interaction: Interaction,
  commands: Collection<string, Command>,
): Promise<void> {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const cmd = commands.get(interaction.commandName)
    if (!cmd) return
    try {
      await cmd.execute(interaction)
    } catch (err) {
      console.error(`[command ${interaction.commandName}]`, err)
      const payload: InteractionReplyOptions = {
        content: '❌ Une erreur est survenue.',
        flags: MessageFlags.Ephemeral,
      }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {})
      } else {
        await interaction.reply(payload).catch(() => {})
      }
    }
    return
  }

  // Composants (menus de sélection)
  if (interaction.isRoleSelectMenu()) {
    if (interaction.customId === SELECT_ID) {
      await handleAutoroleSelect(interaction).catch((err) => console.error('[autorole:select]', err))
    } else if (interaction.customId.startsWith(CREATE_PREFIX)) {
      await handleReactionCreateSelect(interaction).catch((err) =>
        console.error('[reactionrole:create]', err),
      )
    } else if (interaction.customId.startsWith(ADD_PREFIX)) {
      await handleReactionAddSelect(interaction).catch((err) =>
        console.error('[reactionrole:add]', err),
      )
    }
    return
  }
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith(REMOVE_PREFIX)) {
    await handleReactionRemoveSelect(interaction).catch((err) =>
      console.error('[reactionrole:remove]', err),
    )
  }
}
