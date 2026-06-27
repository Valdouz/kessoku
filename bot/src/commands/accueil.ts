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
import { getGuild, setWelcomeChannel } from '../db.js'
import { fetchEventInfo, welcomeEmbed, ACCENT } from '../lib/event.js'

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('accueil')
    .setDescription('Message de bienvenue aux nouveaux membres')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName('salon')
        .setDescription('Définir le salon où poster le message de bienvenue')
        .addChannelOption((o) =>
          o
            .setName('salon')
            .setDescription('Salon d’accueil')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName('apercu').setDescription('Prévisualiser le message d’accueil'))
    .addSubcommand((s) => s.setName('off').setDescription('Désactiver le message d’accueil')),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'salon':
        return doSet(interaction)
      case 'apercu':
        return doPreview(interaction)
      case 'off':
        return doOff(interaction)
    }
  },
}

async function doSet(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('salon', true)
  setWelcomeChannel(interaction.guildId!, channel.id)
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('✅ Accueil configuré')
    .setDescription(`Les nouveaux membres seront accueillis dans ${channelMention(channel.id)}.`)
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
}

async function doPreview(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({ content: 'À utiliser dans un serveur.', flags: MessageFlags.Ephemeral })
    return
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const info = await fetchEventInfo()
  const member = await interaction.guild.members.fetch(interaction.user.id)
  await interaction.editReply({ embeds: [welcomeEmbed(member, info)] })
}

async function doOff(interaction: ChatInputCommandInteraction) {
  const g = getGuild(interaction.guildId!)
  setWelcomeChannel(interaction.guildId!, null)
  await interaction.reply({
    content: g?.welcome_channel_id ? '🛑 Message d’accueil désactivé.' : 'L’accueil n’était pas activé.',
    flags: MessageFlags.Ephemeral,
  })
}
