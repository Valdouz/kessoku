import { SlashCommandBuilder, MessageFlags } from 'discord.js'
import type { Command } from '../lib/command.js'

export const command: Command = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Vérifie que le bot répond.'),
  async execute(interaction) {
    await interaction.reply({
      content: `🏓 Pong — ${Math.round(interaction.client.ws.ping)} ms`,
      flags: MessageFlags.Ephemeral,
    })
  },
}
