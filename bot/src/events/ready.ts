import type { Client } from 'discord.js'
import { startPresence } from '../lib/presence.js'
import { startReminders } from '../lib/reminders.js'
import { runWelcomeCatchup } from '../lib/welcome.js'
import { startLive } from '../lib/live.js'

export function onReady(client: Client<true>): void {
  console.log(`[kessoku-bot] connecté : ${client.user.tag} — ${client.guilds.cache.size} serveur(s)`)
  startPresence(client)
  startReminders(client)
  startLive(client) // mode jour J : cues temps réel du conducteur
  void runWelcomeCatchup(client) // rattrape les arrivées manquées pendant une coupure
}
