import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  channelMention,
  roleMention,
  type ChatInputCommandInteraction,
} from 'discord.js'
import type { Command } from '../lib/command.js'
import {
  getGuild,
  setLiveChannel,
  setLiveRole,
  setLiveLead,
  setLiveEnabled,
} from '../db.js'
import { ACCENT } from '../lib/event.js'

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('live')
    .setDescription('Mode jour J : cues temps réel du conducteur (ping plateau, etc.)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName('salon')
        .setDescription('Salon où poster les cues du jour J')
        .addChannelOption((o) =>
          o.setName('salon').setDescription('Salon des cues').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('role')
        .setDescription('Rôle à mentionner pour les changements de plateau')
        .addRoleOption((o) => o.setName('role').setDescription('Rôle plateau/technique').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('preavis')
        .setDescription('Minutes avant la fin d’un passage pour prévenir (défaut 5)')
        .addIntegerOption((o) =>
          o.setName('minutes').setDescription('1 à 30').setMinValue(1).setMaxValue(30).setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName('on').setDescription('Activer le mode jour J'))
    .addSubcommand((s) => s.setName('off').setDescription('Désactiver le mode jour J'))
    .addSubcommand((s) => s.setName('test').setDescription('Poster un cue d’exemple maintenant'))
    .addSubcommand((s) => s.setName('etat').setDescription('Voir la configuration du mode jour J')),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'salon':
        return doSalon(interaction)
      case 'role':
        return doRole(interaction)
      case 'preavis':
        return doPreavis(interaction)
      case 'on':
        return doToggle(interaction, true)
      case 'off':
        return doToggle(interaction, false)
      case 'test':
        return doTest(interaction)
      default:
        return doEtat(interaction)
    }
  },
}

const ok = (interaction: ChatInputCommandInteraction, text: string) =>
  interaction.reply({ content: text, flags: MessageFlags.Ephemeral })

async function doSalon(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('salon', true)
  setLiveChannel(interaction.guildId!, channel.id)
  await ok(interaction, `✅ Cues du jour J postés dans ${channelMention(channel.id)}. Active avec \`/live on\`.`)
}

async function doRole(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole('role', true)
  setLiveRole(interaction.guildId!, role.id)
  await ok(interaction, `✅ Rôle plateau : ${roleMention(role.id)} (mentionné avant chaque fin de passage).`)
}

async function doPreavis(interaction: ChatInputCommandInteraction) {
  const min = interaction.options.getInteger('minutes', true)
  setLiveLead(interaction.guildId!, min)
  await ok(interaction, `✅ Préavis réglé à **${min} min** avant la fin d’un passage.`)
}

async function doToggle(interaction: ChatInputCommandInteraction, on: boolean) {
  const g = getGuild(interaction.guildId!)
  if (on && !g?.live_channel_id) {
    await ok(interaction, 'Configure d’abord un salon avec `/live salon`.')
    return
  }
  setLiveEnabled(interaction.guildId!, on)
  await ok(
    interaction,
    on
      ? '🎬 Mode jour J **activé**. Le jour de l’événement, je suivrai le conducteur automatiquement.'
      : '🛑 Mode jour J désactivé.',
  )
}

async function doTest(interaction: ChatInputCommandInteraction) {
  const g = getGuild(interaction.guildId!)
  if (!g?.live_channel_id) {
    await ok(interaction, 'Configure un salon avec `/live salon` d’abord.')
    return
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const channel = await interaction.guild!.channels.fetch(g.live_channel_id).catch(() => null)
  if (!channel || !channel.isTextBased() || !('send' in channel)) {
    await interaction.editReply({ content: 'Salon introuvable ou non textuel.' })
    return
  }
  const lead = Math.max(1, Number(g.live_lead_min) || 5)
  const ping = g.live_role_id ? `<@&${g.live_role_id}> ` : ''
  await channel.send({
    content: `⏰ ${ping}**(test)** un passage se termine dans ${lead} min — préparez le changement de plateau.`,
    allowedMentions: g.live_role_id ? { roles: [g.live_role_id] } : { parse: [] },
  })
  await interaction.editReply({ content: '✅ Cue d’exemple posté.' })
}

async function doEtat(interaction: ChatInputCommandInteraction) {
  const g = getGuild(interaction.guildId!)
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('Mode jour J — configuration')
    .addFields(
      { name: 'État', value: g?.live_enabled === '1' ? '🎬 activé' : '🛑 désactivé', inline: true },
      { name: 'Préavis', value: `${Math.max(1, Number(g?.live_lead_min) || 5)} min`, inline: true },
      { name: 'Salon', value: g?.live_channel_id ? channelMention(g.live_channel_id) : '—', inline: true },
      { name: 'Rôle plateau', value: g?.live_role_id ? roleMention(g.live_role_id) : '—', inline: true },
    )
    .setDescription(
      'Le jour de l’événement, je poste le **début de chaque passage** et un **préavis** avant la fin ' +
        '(ping du rôle plateau) — d’après le conducteur du site.',
    )
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
}
