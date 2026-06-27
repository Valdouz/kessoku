import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  roleMention,
  type ChatInputCommandInteraction,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js'
import type { Command } from '../lib/command.js'
import {
  createPanel,
  getPanel,
  latestPanelInChannel,
  addReactionRole,
  removeReactionRoleByRole,
  listReactionRoles,
  panelEmojis,
  getUsedEmojis,
  setRoleEmoji,
  type ReactionPanel,
} from '../db.js'
import { suggestHeart } from '../lib/hearts.js'
import { normalizeEmoji } from '../lib/emoji.js'

const ACCENT = 0xff2e85
export const ADD_PREFIX = 'reactionrole:add:'
export const REMOVE_PREFIX = 'reactionrole:remove:'

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Rôles par réaction : un émoji = un rôle')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName('panel')
        .setDescription('Créer un panneau de rôles par réaction dans ce salon')
        .addStringOption((o) => o.setName('titre').setDescription('Titre du panneau'))
        .addStringOption((o) =>
          o.setName('description').setDescription('Texte affiché en haut du panneau'),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Ajouter un rôle au panneau (émoji cœur proposé automatiquement)')
        .addStringOption((o) =>
          o.setName('message').setDescription('ID du message panneau (défaut : le dernier de ce salon)'),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Retirer un rôle du panneau')
        .addStringOption((o) =>
          o.setName('message').setDescription('ID du message panneau (défaut : le dernier de ce salon)'),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('Lister les rôles par réaction')
        .addStringOption((o) =>
          o.setName('message').setDescription('ID du message panneau (défaut : le dernier de ce salon)'),
        ),
    ),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'panel':
        return doPanel(interaction)
      case 'add':
        return doAdd(interaction)
      case 'remove':
        return doRemove(interaction)
      case 'list':
        return doList(interaction)
    }
  },
}

// ── Rendu du panneau ─────────────────────────────────────────────────────────
/** Construit l'embed du panneau (titre/description + liste des rôles à jour). */
export function renderPanelEmbed(panel: ReactionPanel): EmbedBuilder {
  const roles = listReactionRoles(panel.message_id)
  const lines = roles.length
    ? roles.map((r) => `${r.emoji} ${roleMention(r.role_id)}`).join('\n')
    : '_Aucun rôle pour l’instant — ajoute-en avec_ `/reactionrole add`.'
  return new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle(panel.title || '🎟️ Choisis tes rôles')
    .setDescription(
      `${panel.description || 'Réagis pour obtenir un rôle, retire ta réaction pour l’enlever.'}\n\n${lines}`,
    )
    .setFooter({ text: 'Kessoku · réagis ci-dessous' })
}

/** Résout le panneau visé : option `message`, sinon dernier panneau du salon. */
function resolvePanel(interaction: ChatInputCommandInteraction): ReactionPanel | undefined {
  const messageId = interaction.options.getString('message')
  if (messageId) return getPanel(messageId)
  if (interaction.guildId && interaction.channelId)
    return latestPanelInChannel(interaction.guildId, interaction.channelId)
  return undefined
}

// ── /reactionrole panel ──────────────────────────────────────────────────────
async function doPanel(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild
  const channel = interaction.channel
  if (!guild || !channel || !channel.isTextBased() || channel.isDMBased()) {
    await interaction.reply({
      content: 'À utiliser dans un salon de serveur.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  const title = interaction.options.getString('titre')
  const description = interaction.options.getString('description')

  // On poste d'abord un brouillon, puis on l'enregistre une fois l'ID du message connu.
  const draft: ReactionPanel = {
    message_id: 'draft',
    guild_id: guild.id,
    channel_id: channel.id,
    title,
    description,
    created_at: '',
  }
  const message = await channel.send({ embeds: [renderPanelEmbed(draft)] })
  createPanel(guild.id, channel.id, message.id, title, description)

  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('✅ Panneau créé')
    .setDescription(
      `Ton panneau est en place. Ajoute des rôles avec **\`/reactionrole add\`** ` +
        `(le bot proposera un émoji cœur à la couleur du rôle 💜).`,
    )
    .addFields({ name: 'Message', value: message.url })
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
}

// ── /reactionrole add ────────────────────────────────────────────────────────
async function doAdd(interaction: ChatInputCommandInteraction) {
  const panel = resolvePanel(interaction)
  if (!panel) {
    await interaction.reply({
      content:
        'Aucun panneau trouvé. Crée-en un avec `/reactionrole panel`, ou précise l’option `message`.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(ADD_PREFIX + panel.message_id)
      .setPlaceholder('Choisis le rôle à ajouter au panneau…')
      .setMinValues(1)
      .setMaxValues(1),
  )
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('Ajouter un rôle par réaction')
    .setDescription(
      'Sélectionne le rôle. Un **émoji cœur** à sa couleur (libre dans ce panneau) lui sera attribué, ' +
        'et le bot ajoutera la réaction au panneau. 💜',
    )
  await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral })
}

export async function handleReactionAddSelect(interaction: RoleSelectMenuInteraction) {
  if (!interaction.guild) return
  const messageId = interaction.customId.slice(ADD_PREFIX.length)
  const panel = getPanel(messageId)
  if (!panel) {
    await interaction.update({ content: 'Panneau introuvable.', embeds: [], components: [] })
    return
  }

  const roleId = interaction.values[0]
  const role =
    interaction.guild.roles.cache.get(roleId) ?? (await interaction.guild.roles.fetch(roleId))
  if (!role) {
    await interaction.update({ content: 'Rôle introuvable.', embeds: [], components: [] })
    return
  }

  const me = await interaction.guild.members.fetchMe()
  const assignable =
    role.id !== interaction.guild.id && !role.managed && role.position < me.roles.highest.position

  // Émoji cœur : couleur du rôle, libre dans ce panneau (et de préférence dans la guilde).
  const used = new Set<string>([
    ...getUsedEmojis(interaction.guild.id, role.id),
    ...panelEmojis(messageId),
  ])
  const emoji = suggestHeart(role.color, used)
  if (!emoji) {
    await interaction.update({
      content: 'Plus aucun émoji cœur disponible pour ce panneau.',
      embeds: [],
      components: [],
    })
    return
  }

  addReactionRole(messageId, emoji, role.id)
  setRoleEmoji(interaction.guild.id, role.id, emoji)

  // Ajoute la réaction sur le message du panneau + rafraîchit l'embed.
  const channel = await interaction.guild.channels.fetch(panel.channel_id).catch(() => null)
  let reacted = false
  if (channel && channel.isTextBased()) {
    const message = await channel.messages.fetch(messageId).catch(() => null)
    if (message) {
      await message.react(emoji).catch(() => {})
      await message.edit({ embeds: [renderPanelEmbed(panel)] }).catch(() => {})
      reacted = true
    }
  }

  const embed = new EmbedBuilder()
    .setColor(role.color || ACCENT)
    .setTitle('✅ Rôle ajouté au panneau')
    .setDescription(`${emoji} ${roleMention(role.id)} — réagis avec ${emoji} pour l’obtenir.`)
  if (!reacted)
    embed.addFields({
      name: '⚠️ Réaction non posée',
      value: 'Je n’ai pas pu réagir sur le message. Vérifie mes permissions **Ajouter des réactions**.',
    })
  if (!assignable)
    embed.addFields({
      name: '⚠️ Action requise',
      value:
        'Je ne pourrai pas attribuer ce rôle tel quel. Place **mon rôle au-dessus** de celui-ci ' +
        'et donne-moi la permission **Gérer les rôles**.',
    })
  await interaction.update({ embeds: [embed], components: [] })
}

// ── /reactionrole remove ─────────────────────────────────────────────────────
async function doRemove(interaction: ChatInputCommandInteraction) {
  const panel = resolvePanel(interaction)
  if (!panel) {
    await interaction.reply({
      content: 'Aucun panneau trouvé. Précise l’option `message`.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  const roles = listReactionRoles(panel.message_id)
  if (!roles.length) {
    await interaction.reply({
      content: 'Ce panneau n’a aucun rôle.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  const menu = new StringSelectMenuBuilder()
    .setCustomId(REMOVE_PREFIX + panel.message_id)
    .setPlaceholder('Choisis le rôle à retirer…')
    .addOptions(
      roles.slice(0, 25).map((r) => ({
        label: interaction.guild?.roles.cache.get(r.role_id)?.name ?? r.role_id,
        value: r.role_id,
        emoji: r.emoji,
      })),
    )
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('Retirer un rôle du panneau')
    .setDescription('Sélectionne le rôle à retirer. La réaction correspondante sera supprimée.')
  await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral })
}

export async function handleReactionRemoveSelect(interaction: StringSelectMenuInteraction) {
  if (!interaction.guild) return
  const messageId = interaction.customId.slice(REMOVE_PREFIX.length)
  const panel = getPanel(messageId)
  if (!panel) {
    await interaction.update({ content: 'Panneau introuvable.', embeds: [], components: [] })
    return
  }
  const roleId = interaction.values[0]
  const emoji = removeReactionRoleByRole(messageId, roleId)

  // Retire la réaction du bot + rafraîchit l'embed.
  const channel = await interaction.guild.channels.fetch(panel.channel_id).catch(() => null)
  if (channel && channel.isTextBased()) {
    const message = await channel.messages.fetch(messageId).catch(() => null)
    if (message) {
      if (emoji) {
        const reaction = message.reactions.cache.find(
          (r) => normalizeEmoji(r.emoji.name) === normalizeEmoji(emoji),
        )
        await reaction?.remove().catch(() => {})
      }
      await message.edit({ embeds: [renderPanelEmbed(panel)] }).catch(() => {})
    }
  }

  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('🗑️ Rôle retiré')
    .setDescription(`${emoji ? `${emoji} ` : ''}${roleMention(roleId)} n’est plus dans le panneau.`)
  await interaction.update({ embeds: [embed], components: [] })
}

// ── /reactionrole list ───────────────────────────────────────────────────────
async function doList(interaction: ChatInputCommandInteraction) {
  const panel = resolvePanel(interaction)
  if (!panel) {
    await interaction.reply({
      content: 'Aucun panneau trouvé dans ce salon.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  await interaction.reply({ embeds: [renderPanelEmbed(panel)], flags: MessageFlags.Ephemeral })
}
