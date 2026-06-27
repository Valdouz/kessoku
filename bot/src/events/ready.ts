import type { Client } from 'discord.js'
import { startPresence } from '../lib/presence.js'

export function onReady(client: Client<true>): void {
  console.log(`[kessoku-bot] connecté : ${client.user.tag} — ${client.guilds.cache.size} serveur(s)`)
  startPresence(client)
}
