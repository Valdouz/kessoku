import type { Client } from 'discord.js'
import { startPresence } from '../lib/presence.js'
import { startReminders } from '../lib/reminders.js'
import { runWelcomeCatchup } from '../lib/welcome.js'

export function onReady(client: Client<true>): void {
  console.log(`[kessoku-bot] connecté : ${client.user.tag} — ${client.guilds.cache.size} serveur(s)`)
  startPresence(client)
  startReminders(client)
  void runWelcomeCatchup(client) // rattrape les arrivées manquées pendant une coupure
}
