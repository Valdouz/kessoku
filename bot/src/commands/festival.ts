import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js'
import type { Command } from '../lib/command.js'
import { siteApi, siteApiConfigured } from '../lib/siteApi.js'

const ACCENT = 0xff2e85

// ── Réponses de l'API du site ────────────────────────────────────────────────
interface EventInfo {
  name: string; edition: string; kind: string; date: string
  startTime: string; endTime: string; crewAccessTime: string; loadInDeadline: string
  venue: string; city: string; context: string; description: string
}
interface Programme {
  event: string; date: string
  slots: { title: string; type: string; startTime: string; durationMin: number; stage: string; artist: string | null }[]
}
interface Contacts {
  event: string
  members: { name: string; roles: string[]; org: string; phone: string; email: string; isPartner: boolean }[]
}
interface Artistes {
  event: string
  artists: { name: string; kind: string; status: string; members: string; setDurationMin?: number; soundcheckTime: string; arrivalTime?: string; partySize?: number }[]
}

// ── Libellés ─────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  coordination: 'Coordination', artistes: 'Artistes', communication: 'Communication',
  logistique: 'Logistique', son: 'Son', securite: 'Sécurité',
  partenaire: 'Partenaire', contact_externe: 'Contact externe', autre: 'Autre',
}
const STATUS_LABELS: Record<string, string> = {
  pressenti: 'pressenti', contacte: 'contacté', confirme: '✅ confirmé', desiste: '❌ désisté',
}
const SLOT_EMOJI: Record<string, string> = {
  scene: '🎤', danse: '💃', dj: '🎧', pause: '⏸️', technique: '🔧', discours: '🗣️', autre: '•',
}

function frDate(iso: string): string {
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('festival')
    .setDescription('Infos du prochain événement (depuis le site Kessoku)')
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('infos').setDescription('Date, horaires, lieu du prochain événement'))
    .addSubcommand((s) => s.setName('programme').setDescription('Le déroulé du jour (conducteur)'))
    .addSubcommand((s) => s.setName('artistes').setDescription('La programmation artistique'))
    .addSubcommand((s) =>
      s.setName('contacts').setDescription('La feuille de contacts de l’équipe (orga uniquement)'),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand()
    const ephemeral = sub === 'contacts'
    if (!siteApiConfigured()) {
      await interaction.reply({
        content: 'Le lien avec le site n’est pas configuré (SITE_API_URL).',
        flags: MessageFlags.Ephemeral,
      })
      return
    }
    // Contacts = données sensibles → réservé à l'orga + en éphémère.
    if (sub === 'contacts' && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: 'Réservé à l’organisation (permission *Gérer le serveur*).',
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    await interaction.deferReply(ephemeral ? { flags: MessageFlags.Ephemeral } : {})
    try {
      const embed = await build(sub)
      await interaction.editReply({ embeds: [embed] })
    } catch (err) {
      const msg = String((err as Error).message || '')
      const text = msg.includes('404')
        ? 'Aucun événement à venir dans le site.'
        : 'Impossible de récupérer les infos du site pour le moment.'
      await interaction.editReply({ content: text })
    }
  },
}

async function build(sub: string): Promise<EmbedBuilder> {
  switch (sub) {
    case 'programme':
      return programmeEmbed(await siteApi<Programme>('/api/programme'))
    case 'artistes':
      return artistesEmbed(await siteApi<Artistes>('/api/artistes'))
    case 'contacts':
      return contactsEmbed(await siteApi<Contacts>('/api/contacts'))
    case 'infos':
    default:
      return infosEmbed(await siteApi<EventInfo>('/api/event-info'))
  }
}

function infosEmbed(e: EventInfo): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle(`🎪 ${e.name}${e.edition ? ` · ${e.edition}` : ''}`)
    .addFields(
      { name: '📅 Date', value: frDate(e.date), inline: false },
      { name: '🕐 Horaires', value: e.startTime && e.endTime ? `${e.startTime} – ${e.endTime}` : '—', inline: true },
      { name: '🚪 Accès équipe', value: e.crewAccessTime || '—', inline: true },
      { name: '📦 Dépose matériel', value: e.loadInDeadline || '—', inline: true },
      { name: '📍 Lieu', value: [e.venue, e.city].filter(Boolean).join(', ') || '—', inline: false },
    )
  if (e.context) embed.addFields({ name: '🎟️ Cadre', value: e.context, inline: false })
  if (e.description) embed.setDescription(e.description.slice(0, 4000))
  return embed
}

function programmeEmbed(p: Programme): EmbedBuilder {
  const lines = p.slots.map((s) => {
    const emoji = SLOT_EMOJI[s.type] ?? '•'
    const who = s.artist ? ` — **${s.artist}**` : ''
    const dur = s.durationMin ? ` _(${s.durationMin} min)_` : ''
    return `\`${s.startTime || '··:··'}\` ${emoji} ${s.title}${who}${dur}`
  })
  return new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle(`🎶 Programme — ${p.event}`)
    .setDescription(lines.length ? lines.join('\n').slice(0, 4096) : '_Aucun créneau pour l’instant._')
    .setFooter({ text: frDate(p.date) })
}

function artistesEmbed(a: Artistes): EmbedBuilder {
  const lines = a.artists.map((ar) => {
    const status = STATUS_LABELS[ar.status] ?? ar.status
    const extras = [
      ar.setDurationMin ? `${ar.setDurationMin} min` : '',
      ar.soundcheckTime ? `balance ${ar.soundcheckTime}` : '',
      ar.partySize ? `${ar.partySize} pers.` : '',
    ].filter(Boolean).join(' · ')
    return `**${ar.name}** _(${ar.kind})_ — ${status}${extras ? `\n   ${extras}` : ''}`
  })
  return new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle(`🎤 Artistes — ${a.event}`)
    .setDescription(lines.length ? lines.join('\n').slice(0, 4096) : '_Aucun artiste pour l’instant._')
}

function contactsEmbed(c: Contacts): EmbedBuilder {
  const lines = c.members.map((m) => {
    const roles = m.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')
    const head = `**${m.name}**${roles ? ` — ${roles}` : ''}${m.isPartner ? ' 🤝' : ''}`
    const coords = [m.phone ? `📞 ${m.phone}` : '', m.email ? `✉️ ${m.email}` : '', m.org ? `🏢 ${m.org}` : '']
      .filter(Boolean).join(' · ')
    return coords ? `${head}\n   ${coords}` : head
  })
  return new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle(`📇 Contacts — ${c.event}`)
    .setDescription(lines.length ? lines.join('\n').slice(0, 4096) : '_Aucun contact pour l’instant._')
}
