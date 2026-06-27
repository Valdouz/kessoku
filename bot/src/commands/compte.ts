import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
} from 'discord.js'
import type { Command } from '../lib/command.js'
import { siteApi, siteApiConfigured } from '../lib/siteApi.js'
import { ACCENT } from '../lib/event.js'

export const LINK_MODAL_ID = 'compte:lier'

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('compte')
    .setDescription('Lier ton compte Kessoku (le site) à ton Discord')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('lier').setDescription('Lier ton compte Kessoku à ce Discord'))
    .addSubcommand((s) => s.setName('statut').setDescription('Voir si ton Discord est lié à un compte'))
    .addSubcommand((s) => s.setName('delier').setDescription('Délier ton compte Kessoku de ce Discord')),

  async execute(interaction) {
    if (!siteApiConfigured()) {
      await interaction.reply({
        content: 'Le lien avec le site n’est pas configuré.',
        flags: MessageFlags.Ephemeral,
      })
      return
    }
    switch (interaction.options.getSubcommand()) {
      case 'lier':
        return showLink(interaction)
      case 'statut':
        return showStatus(interaction)
      default:
        return doUnlink(interaction)
    }
  },
}

async function showLink(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder().setCustomId(LINK_MODAL_ID).setTitle('Lier mon compte Kessoku')
  const user = new TextInputBuilder()
    .setCustomId('user').setLabel('Identifiant Kessoku')
    .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(64)
  const pass = new TextInputBuilder()
    .setCustomId('pass').setLabel('Mot de passe Kessoku')
    .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(128)
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(user),
    new ActionRowBuilder<TextInputBuilder>().addComponents(pass),
  )
  await interaction.showModal(modal)
}

export async function handleCompteLinkModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const username = interaction.fields.getTextInputValue('user')
  const password = interaction.fields.getTextInputValue('pass')
  try {
    const r = await siteApi<{ ok: boolean; username: string }>('/api/discord/link-credentials', {
      method: 'POST',
      body: JSON.stringify({ discordId: interaction.user.id, username, password }),
    })
    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle('✅ Compte lié')
      .setDescription(
        `Ton Discord est maintenant lié au compte Kessoku **${r.username}**.\n` +
          'Tu pourras te connecter au site via « Se connecter avec Discord ». 💜',
      )
    await interaction.editReply({ embeds: [embed] })
  } catch (e) {
    const msg = String((e as Error).message || '')
    const text = msg.includes('401')
      ? 'Identifiants Kessoku invalides.'
      : msg.includes('409')
        ? 'Ce Discord est déjà lié à un autre compte.'
        : msg.includes('429')
          ? 'Trop d’essais, réessaie dans une minute.'
          : 'Impossible de lier pour le moment.'
    await interaction.editReply({ content: text })
  }
}

async function showStatus(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  try {
    const r = await siteApi<{ linked: boolean; username: string | null }>(
      `/api/discord/linked?discordId=${interaction.user.id}`,
    )
    await interaction.editReply({
      content: r.linked
        ? `✅ Ton Discord est lié au compte **${r.username}**.`
        : 'Ton Discord n’est lié à aucun compte. Utilise `/compte lier`.',
    })
  } catch {
    await interaction.editReply({ content: 'Indisponible pour le moment.' })
  }
}

async function doUnlink(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  try {
    const r = await siteApi<{ ok: boolean; removed: boolean }>('/api/discord/unlink', {
      method: 'POST',
      body: JSON.stringify({ discordId: interaction.user.id }),
    })
    await interaction.editReply({
      content: r.removed ? '🛑 Compte délié.' : 'Aucun compte lié à ce Discord.',
    })
  } catch {
    await interaction.editReply({ content: 'Indisponible pour le moment.' })
  }
}
