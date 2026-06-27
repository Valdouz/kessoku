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
  type Guild,
  type Message,
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
export const CREATE_PREFIX = 'reactionrole:create:'
export const ADD_PREFIX = 'reactionrole:add:'
export const REMOVE_PREFIX = 'reactionrole:remove:'

// Brouillons de panneau en attente de sélection des rôles (clé = id de l'interaction /panel).
// Le bot écrit le message une fois les rôles choisis ; on garde juste titre/description ici.
interface PendingPanel {
  guildId: string
  channelId: string
  title: string | null
  description: string | null
}
const pending = new Map<string, PendingPanel>()

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Rôles par réaction : un émoji = un rôle')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName('panel')
        .setDescription('Créer un panneau : choisis les rôles, le bot écrit le message')
        .addStringOption((o) => o.setName('titre').setDescription('Titre du panneau'))
        .addStringOption((o) =>
          o.setName('description').setDescription('Texte affiché en haut du panneau'),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Ajouter des rôles à un panneau (émoji cœur proposé automatiquement)')
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
    : '_Aucun rôle pour l’instant._'
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

/**
 * Attribue une liste de rôles à un panneau : un émoji cœur unique par rôle,
 * écrit les mappings, pose les réactions et met l'embed du message à jour.
 */
async function applyRolesToMessage(
  guild: Guild,
  message: Message,
  panel: ReactionPanel,
  roleIds: string[],
): Promise<{ added: { roleId: string; emoji: string; assignable: boolean }[]; ranOut: boolean }> {
  const me = await guild.members.fetchMe()
  const existing = new Set(listReactionRoles(panel.message_id).map((r) => r.role_id))
  const used = new Set<string>([...getUsedEmojis(guild.id), ...panelEmojis(panel.message_id)])

  const added: { roleId: string; emoji: string; assignable: boolean }[] = []
  let ranOut = false

  for (const roleId of roleIds) {
    if (existing.has(roleId)) continue // déjà dans ce panneau
    const role = guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId).catch(() => null))
    if (!role || role.id === guild.id || role.managed) continue

    const emoji = suggestHeart(role.color, used)
    if (!emoji) {
      ranOut = true
      break
    }
    used.add(emoji)
    addReactionRole(panel.message_id, emoji, role.id)
    setRoleEmoji(guild.id, role.id, emoji)
    added.push({ roleId: role.id, emoji, assignable: role.position < me.roles.highest.position })
  }

  // Pose les réactions puis met l'embed à jour (lit la liste fraîche en base).
  for (const a of added) await message.react(a.emoji).catch(() => {})
  await message.edit({ embeds: [renderPanelEmbed(getPanel(panel.message_id) ?? panel)] }).catch(() => {})

  return { added, ranOut }
}

/** Récapitulatif (embed éphémère) après attribution de rôles. */
function summaryEmbed(
  added: { roleId: string; emoji: string; assignable: boolean }[],
  ranOut: boolean,
  url?: string,
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(ACCENT)
  if (!added.length) {
    embed.setTitle('Aucun rôle ajouté').setDescription(
      'Ces rôles étaient déjà dans le panneau, ou non attribuables (rôle géré / @everyone).',
    )
    return embed
  }
  embed
    .setTitle(`✅ ${added.length} rôle(s) ajouté(s)`)
    .setDescription(added.map((a) => `${a.emoji} ${roleMention(a.roleId)}`).join('\n'))
  if (url) embed.addFields({ name: 'Panneau', value: url })

  const blocked = added.filter((a) => !a.assignable)
  if (blocked.length)
    embed.addFields({
      name: '⚠️ Hiérarchie à corriger',
      value:
        `Je ne pourrai pas donner ${blocked.map((a) => roleMention(a.roleId)).join(', ')} ` +
        'tant que **mon rôle** n’est pas **au-dessus** d’eux (avec la permission **Gérer les rôles**).',
    })
  if (ranOut)
    embed.addFields({
      name: 'ℹ️ Émojis épuisés',
      value: 'Tous les cœurs disponibles sont déjà utilisés dans ce panneau ; certains rôles n’ont pas été ajoutés.',
    })
  return embed
}

// ── /reactionrole panel ──────────────────────────────────────────────────────
// Étape 1 : on demande les rôles. Le message sera écrit par le bot après sélection.
async function doPanel(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild
  const channel = interaction.channel
  if (!guild || !interaction.channelId || !channel || !channel.isTextBased() || channel.isDMBased()) {
    await interaction.reply({
      content: 'À utiliser dans un salon de serveur.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  pending.set(interaction.id, {
    guildId: guild.id,
    channelId: interaction.channelId,
    title: interaction.options.getString('titre'),
    description: interaction.options.getString('description'),
  })
  // Nettoyage si jamais l'utilisateur ne sélectionne rien.
  setTimeout(() => pending.delete(interaction.id), 10 * 60 * 1000).unref?.()

  const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(CREATE_PREFIX + interaction.id)
      .setPlaceholder('Choisis les rôles du panneau…')
      .setMinValues(1)
      .setMaxValues(25),
  )
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('Nouveau panneau de rôles')
    .setDescription(
      'Sélectionne les **rôles** à proposer. Le bot **écrira le message** automatiquement, ' +
        'avec un **émoji cœur** à la couleur de chaque rôle. 💜',
    )
  await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral })
}

// Étape 2 : rôles choisis → le bot écrit le message complet.
export async function handleReactionCreateSelect(interaction: RoleSelectMenuInteraction) {
  if (!interaction.guild) return
  const draft = pending.get(interaction.customId.slice(CREATE_PREFIX.length))
  pending.delete(interaction.customId.slice(CREATE_PREFIX.length))
  if (!draft) {
    await interaction.update({
      content: 'Cette création a expiré. Relance `/reactionrole panel`.',
      embeds: [],
      components: [],
    })
    return
  }

  const channel = await interaction.guild.channels.fetch(draft.channelId).catch(() => null)
  if (!channel || !channel.isTextBased()) {
    await interaction.update({ content: 'Salon introuvable.', embeds: [], components: [] })
    return
  }

  // Le bot écrit le message, puis on y attribue les rôles sélectionnés.
  const draftPanel: ReactionPanel = {
    message_id: 'draft',
    guild_id: interaction.guild.id,
    channel_id: draft.channelId,
    title: draft.title,
    description: draft.description,
    created_at: '',
  }
  const message = await channel.send({ embeds: [renderPanelEmbed(draftPanel)] })
  createPanel(interaction.guild.id, draft.channelId, message.id, draft.title, draft.description)
  const panel = getPanel(message.id)!

  const { added, ranOut } = await applyRolesToMessage(
    interaction.guild,
    message,
    panel,
    interaction.values,
  )

  await interaction.update({
    embeds: [summaryEmbed(added, ranOut, message.url)],
    components: [],
  })
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
      .setPlaceholder('Choisis les rôles à ajouter…')
      .setMinValues(1)
      .setMaxValues(25),
  )
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('Ajouter des rôles au panneau')
    .setDescription(
      'Sélectionne un ou plusieurs rôles. Un **émoji cœur** à leur couleur (libre dans ce panneau) ' +
        'leur sera attribué, et le bot ajoutera les réactions. 💜',
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
  const channel = await interaction.guild.channels.fetch(panel.channel_id).catch(() => null)
  const message =
    channel && channel.isTextBased()
      ? await channel.messages.fetch(messageId).catch(() => null)
      : null
  if (!message) {
    await interaction.update({
      content: 'Message du panneau introuvable (supprimé ?).',
      embeds: [],
      components: [],
    })
    return
  }

  const { added, ranOut } = await applyRolesToMessage(
    interaction.guild,
    message,
    panel,
    interaction.values,
  )
  await interaction.update({
    embeds: [summaryEmbed(added, ranOut, message.url)],
    components: [],
  })
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
