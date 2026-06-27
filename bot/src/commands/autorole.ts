import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  MessageFlags,
  roleMention,
  type ChatInputCommandInteraction,
  type RoleSelectMenuInteraction,
} from 'discord.js'
import type { Command } from '../lib/command.js'
import { getGuild, setAutorole, disableAutorole, getUsedEmojis } from '../db.js'
import { suggestHeart } from '../lib/hearts.js'

export const SELECT_ID = 'autorole:select'
const ACCENT = 0xff2e85

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Rôle attribué automatiquement aux nouveaux membres')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('set').setDescription("Choisir le rôle attribué à l'arrivée"))
    .addSubcommand((s) => s.setName('status').setDescription('Voir la configuration actuelle'))
    .addSubcommand((s) => s.setName('disable').setDescription("Désactiver l'autorole")),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'set':
        return showSelect(interaction)
      case 'status':
        return showStatus(interaction)
      case 'disable':
        return doDisable(interaction)
    }
  },
}

// Beau sélecteur de rôle (menu natif Discord).
async function showSelect(interaction: ChatInputCommandInteraction) {
  const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(SELECT_ID)
      .setPlaceholder('Choisis le rôle à attribuer…')
      .setMinValues(1)
      .setMaxValues(1),
  )
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('Autorole')
    .setDescription(
      'Sélectionne le rôle **attribué automatiquement** à chaque nouveau membre.\n' +
        'Un émoji cœur à la couleur du rôle te sera proposé. 💜',
    )
  await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral })
}

// Après sélection dans le menu : enregistre + propose le cœur de la couleur du rôle.
export async function handleAutoroleSelect(interaction: RoleSelectMenuInteraction) {
  if (!interaction.guild) return
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

  // Émoji proposé : cœur à la couleur du rôle, s'il n'est pas déjà pris par un autre rôle.
  const used = getUsedEmojis(interaction.guild.id, role.id)
  const emoji = suggestHeart(role.color, used)

  setAutorole(interaction.guild.id, role.id, emoji || null)

  const embed = new EmbedBuilder()
    .setColor(role.color || ACCENT)
    .setTitle('✅ Autorole configuré')
    .setDescription(
      `${emoji ? `${emoji} ` : ''}${roleMention(role.id)} sera attribué automatiquement aux nouveaux membres.`,
    )
  if (emoji) embed.addFields({ name: 'Émoji proposé', value: emoji, inline: true })
  if (!assignable) {
    embed.addFields({
      name: '⚠️ Action requise',
      value:
        'Je ne pourrai pas attribuer ce rôle tel quel. Place **mon rôle au-dessus** de celui-ci ' +
        '(Paramètres du serveur → Rôles) et donne-moi la permission **Gérer les rôles**.',
    })
  }
  await interaction.update({ embeds: [embed], components: [] })
}

async function showStatus(interaction: ChatInputCommandInteraction) {
  const g = interaction.guildId ? getGuild(interaction.guildId) : undefined
  const embed = new EmbedBuilder().setColor(ACCENT).setTitle('Autorole — configuration')
  embed.setDescription(
    g?.autorole_id
      ? `${g.autorole_emoji ? `${g.autorole_emoji} ` : ''}${roleMention(g.autorole_id)} est attribué aux nouveaux membres.`
      : 'Aucun autorole configuré. Utilise `/autorole set`.',
  )
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
}

async function doDisable(interaction: ChatInputCommandInteraction) {
  if (interaction.guildId) disableAutorole(interaction.guildId)
  await interaction.reply({ content: '🛑 Autorole désactivé.', flags: MessageFlags.Ephemeral })
}
