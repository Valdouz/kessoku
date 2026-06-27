import { MessageFlags, type Collection, type Interaction, type InteractionReplyOptions } from 'discord.js'
import type { Command } from '../lib/command.js'
import { handleAutoroleSelect, SELECT_ID } from '../commands/autorole.js'

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

  // Composants (menu de sélection de rôle de l'autorole)
  if (interaction.isRoleSelectMenu() && interaction.customId === SELECT_ID) {
    await handleAutoroleSelect(interaction).catch((err) => {
      console.error('[autorole:select]', err)
    })
  }
}
