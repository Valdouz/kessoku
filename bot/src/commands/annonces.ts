import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  channelMention,
  type ChatInputCommandInteraction,
} from 'discord.js'
import type { Command } from '../lib/command.js'
import { getGuild, setAnnounceChannel } from '../db.js'
import { fetchEventInfo, announceEmbed, ACCENT } from '../lib/event.js'

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('annonces')
    .setDescription('Rappels automatiques du prochain événement (J-7, J-3, J-1, jour J)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName('salon')
        .setDescription('Définir le salon des rappels automatiques')
        .addChannelOption((o) =>
          o
            .setName('salon')
            .setDescription('Salon des annonces')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName('test').setDescription('Poster un rappel maintenant (test)'))
    .addSubcommand((s) => s.setName('off').setDescription('Désactiver les rappels automatiques')),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'salon':
        return doSet(interaction)
      case 'test':
        return doTest(interaction)
      case 'off':
        return doOff(interaction)
    }
  },
}

async function doSet(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('salon', true)
  setAnnounceChannel(interaction.guildId!, channel.id)
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('✅ Annonces configurées')
    .setDescription(
      `Je posterai les rappels (J-7, J-3, J-1, jour J) dans ${channelMention(channel.id)}.`,
    )
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
}

async function doTest(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const info = await fetchEventInfo()
  if (!info) {
    await interaction.editReply({ content: 'Aucun événement à venir (ou site indisponible).' })
    return
  }
  await interaction.editReply({ embeds: [announceEmbed(info)] })
}

async function doOff(interaction: ChatInputCommandInteraction) {
  const g = getGuild(interaction.guildId!)
  setAnnounceChannel(interaction.guildId!, null)
  await interaction.reply({
    content: g?.announce_channel_id ? '🛑 Rappels désactivés.' : 'Les rappels n’étaient pas activés.',
    flags: MessageFlags.Ephemeral,
  })
}
