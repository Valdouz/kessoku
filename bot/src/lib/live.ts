// Mode « jour J » : suit le conducteur en temps réel et poste des cues
// (début de passage, préavis de fin -> ping plateau pour le changement).
import type { Client } from 'discord.js'
import { listLiveGuilds, hasFired, markFired } from '../db.js'
import { siteApi, siteApiConfigured } from './siteApi.js'
import { parisEpoch, parisToday, parisHM } from './time.js'

interface ProgrammeSlot {
  title: string
  type: string
  startTime: string
  durationMin: number
  stage: string
  artist: string | null
}
interface Programme {
  event: string
  date: string
  slots: ProgrammeSlot[]
}

const CHECK_MS = 30_000
const WINDOW_MS = 90_000 // une cue se déclenche dans cette fenêtre après son heure (sinon ratée)
const LEAD_SKIP = new Set(['pause', 'technique']) // pas de « préparez le plateau » pour ces types
const DEFAULT_LEAD = 5

async function tick(client: Client): Promise<void> {
  const guilds = listLiveGuilds()
  if (!guilds.length || !siteApiConfigured()) return

  let prog: Programme | null = null
  try {
    prog = await siteApi<Programme>('/api/programme')
  } catch {
    return
  }
  if (!prog || !prog.slots || !prog.slots.length) return
  if (parisToday() !== prog.date.slice(0, 10)) return // uniquement le jour de l'événement

  const now = Date.now()
  for (const g of guilds) {
    const lead = Math.max(1, Number(g.live_lead_min) || DEFAULT_LEAD)
    const channel = await client.channels.fetch(g.live_channel_id).catch(() => null)
    if (!channel || !channel.isTextBased() || !('send' in channel)) continue

    const fire = async (key: string, cueMs: number, opts: Parameters<typeof channel.send>[0]) => {
      if (cueMs > now || now - cueMs >= WINDOW_MS) return // pas encore, ou trop tard (raté)
      if (hasFired(g.guild_id, key)) return
      try {
        await channel.send(opts)
        markFired(g.guild_id, key)
      } catch (e) {
        console.warn('[live] envoi échoué:', (e as Error).message)
      }
    }

    for (const s of prog.slots) {
      if (!s.startTime) continue
      const startMs = parisEpoch(prog.date, s.startTime)
      const durMs = (Number(s.durationMin) || 0) * 60_000

      // Cue 1 — début de passage (info, sans ping).
      const who = s.artist ? ` — **${s.artist}**` : ''
      const where = s.stage ? ` · ${s.stage}` : ''
      await fire(`start|${prog.date}|${s.startTime}|${s.title}`, startMs, {
        content: `▶️ **${parisHM(startMs)}** — ${s.title}${who}${where}`,
        allowedMentions: { parse: [] },
      })

      // Cue 2 — préavis de fin -> ping plateau pour préparer le changement.
      if (!LEAD_SKIP.has(s.type) && durMs > lead * 60_000) {
        const leadMs = startMs + durMs - lead * 60_000
        const ping = g.live_role_id ? `<@&${g.live_role_id}> ` : ''
        await fire(`lead|${prog.date}|${s.startTime}|${s.title}`, leadMs, {
          content: `⏰ ${ping}**${s.title}** se termine dans ${lead} min — préparez le changement de plateau.`,
          allowedMentions: g.live_role_id ? { roles: [g.live_role_id] } : { parse: [] },
        })
      }
    }
  }
}

export function startLive(client: Client): void {
  void tick(client)
  setInterval(() => void tick(client), CHECK_MS)
}
