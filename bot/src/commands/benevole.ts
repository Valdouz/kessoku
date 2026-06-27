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

export const MODAL_ID = 'benevole:form'

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('benevole')
    .setDescription('Se porter bénévole pour l’événement')
    .setDMPermission(false)
    .addSubcommand((s) =>
      s.setName('inscription').setDescription('S’inscrire / mettre à jour ses infos bénévole'),
    )
    .addSubcommand((s) => s.setName('retrait').setDescription('Retirer mon inscription bénévole')),

  async execute(interaction) {
    if (!siteApiConfigured()) {
      await interaction.reply({
        content: 'Le lien avec le site n’est pas configuré.',
        flags: MessageFlags.Ephemeral,
      })
      return
    }
    if (interaction.options.getSubcommand() === 'inscription') return showForm(interaction)
    return doRetrait(interaction)
  },
}

// Joli formulaire (modal) : poste, dispos, téléphone, notes.
async function showForm(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder().setCustomId(MODAL_ID).setTitle('Inscription bénévole')
  const poste = new TextInputBuilder()
    .setCustomId('poste').setLabel('Poste / mission souhaitée')
    .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
    .setPlaceholder('accueil, bar, montage, sécurité…')
  const dispo = new TextInputBuilder()
    .setCustomId('dispo').setLabel('Disponibilités')
    .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
    .setPlaceholder('ex. samedi 9h–18h, démontage ok')
  const tel = new TextInputBuilder()
    .setCustomId('tel').setLabel('Téléphone (optionnel)')
    .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(40)
  const notes = new TextInputBuilder()
    .setCustomId('notes').setLabel('Infos complémentaires (optionnel)')
    .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(400)
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(poste),
    new ActionRowBuilder<TextInputBuilder>().addComponents(dispo),
    new ActionRowBuilder<TextInputBuilder>().addComponents(tel),
    new ActionRowBuilder<TextInputBuilder>().addComponents(notes),
  )
  await interaction.showModal(modal)
}

export async function handleBenevoleModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const poste = interaction.fields.getTextInputValue('poste')
  const dispo = interaction.fields.getTextInputValue('dispo')
  const tel = interaction.fields.getTextInputValue('tel')
  const notes = interaction.fields.getTextInputValue('notes')

  // Nom affiché : pseudo serveur si possible, sinon nom global / username.
  const member = interaction.guild
    ? await interaction.guild.members.fetch(interaction.user.id).catch(() => null)
    : null
  const name = member?.displayName ?? interaction.user.globalName ?? interaction.user.username

  try {
    const r = await siteApi<{ ok: boolean; event: string; updated: boolean }>('/api/volunteer', {
      method: 'POST',
      body: JSON.stringify({ discordId: interaction.user.id, name, poste, availability: dispo, phone: tel, notes }),
    })
    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle(r.updated ? '✅ Infos bénévole mises à jour' : '✅ Inscription bénévole enregistrée')
      .setDescription(`Merci **${name}** ! Tu es bénévole pour **${r.event}**. 💜`)
      .addFields({ name: 'Poste', value: poste || '—', inline: true })
      .addFields({ name: 'Disponibilités', value: dispo || '—' })
    if (tel) embed.addFields({ name: 'Téléphone', value: tel, inline: true })
    embed.setFooter({ text: 'Tu peux refaire /benevole inscription pour modifier, ou /benevole retrait.' })
    await interaction.editReply({ embeds: [embed] })
  } catch {
    await interaction.editReply({ content: 'Impossible d’enregistrer pour le moment (site indisponible ?).' })
  }
}

async function doRetrait(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  try {
    const r = await siteApi<{ ok: boolean; removed: boolean }>('/api/volunteer', {
      method: 'DELETE',
      body: JSON.stringify({ discordId: interaction.user.id }),
    })
    await interaction.editReply({
      content: r.removed ? '🛑 Ton inscription bénévole a été retirée.' : 'Tu n’étais pas inscrit·e.',
    })
  } catch {
    await interaction.editReply({ content: 'Impossible de retirer pour le moment.' })
  }
}
