// Infos du prochain événement (lues sur le site) + fabriques d'embeds partagées
// par l'accueil des membres et les annonces automatiques.
import { EmbedBuilder, type GuildMember } from 'discord.js'
import { siteApi, siteApiConfigured } from './siteApi.js'

export const ACCENT = 0xff2e85

export interface EventInfo {
  name: string
  edition: string
  kind: string
  date: string
  startTime: string
  endTime: string
  crewAccessTime: string
  loadInDeadline: string
  venue: string
  city: string
  context: string
  description: string
}

export async function fetchEventInfo(): Promise<EventInfo | null> {
  if (!siteApiConfigured()) return null
  try {
    return await siteApi<EventInfo>('/api/event-info')
  } catch {
    return null
  }
}

export function frDate(iso: string): string {
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Nombre de jours (date seule) avant l'événement ; négatif si passé. */
export function daysUntil(iso: string): number {
  const target = new Date(iso.slice(0, 10) + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** "dans 7 jours" / "c'est demain" / "c'est aujourd'hui" / "" si passé. */
export function countdownLabel(iso: string): string {
  const d = daysUntil(iso)
  if (d > 1) return `dans ${d} jours`
  if (d === 1) return 'c’est demain'
  if (d === 0) return 'c’est aujourd’hui'
  return ''
}

function infoFields(info: EventInfo) {
  return [
    { name: '📅 Date', value: frDate(info.date), inline: false },
    {
      name: '🕐 Horaires',
      value: info.startTime && info.endTime ? `${info.startTime} – ${info.endTime}` : '—',
      inline: true,
    },
    { name: '📍 Lieu', value: [info.venue, info.city].filter(Boolean).join(', ') || '—', inline: true },
  ]
}

/** Embed d'accueil personnalisé pour un nouveau membre. */
export function welcomeEmbed(member: GuildMember, info: EventInfo | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle(`Bienvenue ${member.displayName} ! 🎉`)
    .setThumbnail(member.user.displayAvatarURL())
  if (info) {
    const cd = countdownLabel(info.date)
    embed
      .setDescription(
        `Ravi de t’avoir parmi nous pour **${info.name}**${cd ? ` — ${cd} !` : ' !'}\n` +
          'Pense à choisir tes rôles sur le panneau dédié. 💜',
      )
      .addFields(infoFields(info))
  } else {
    embed.setDescription('Ravi de t’avoir parmi nous ! Pense à choisir tes rôles. 💜')
  }
  return embed
}

/** Embed d'annonce/rappel (compte à rebours du prochain événement). */
export function announceEmbed(info: EventInfo): EmbedBuilder {
  const cd = countdownLabel(info.date)
  const d = daysUntil(info.date)
  const title = d === 0 ? `🎉 C’est le jour J — ${info.name} !` : `⏳ ${info.name}, ${cd} !`
  const embed = new EmbedBuilder().setColor(ACCENT).setTitle(title).addFields(infoFields(info))
  if (info.crewAccessTime)
    embed.addFields({ name: '🚪 Accès équipe', value: info.crewAccessTime, inline: true })
  if (d === 0) embed.setDescription('On y est ! Bon festival à toutes et tous 🎶')
  return embed
}
