// Enregistre les slash commands auprès de Discord.
//   Guilde (instantané) si DISCORD_GUILD_ID est défini, sinon global (~1h).
import 'dotenv/config'
import { REST, Routes } from 'discord.js'
import { loadCommands } from './lib/loaders.js'

const token = process.env.DISCORD_TOKEN
if (!token) {
  console.error('DISCORD_TOKEN manquant')
  process.exit(1)
}

// L'app id est le 1er segment du token (base64). On le dérive si DISCORD_CLIENT_ID est vide.
function clientIdFromToken(t: string): string {
  try {
    return Buffer.from(t.split('.')[0] ?? '', 'base64').toString('utf8')
  } catch {
    return ''
  }
}
const clientId = process.env.DISCORD_CLIENT_ID || clientIdFromToken(token)
if (!clientId) {
  console.error('Impossible de déterminer DISCORD_CLIENT_ID')
  process.exit(1)
}
const guildId = process.env.DISCORD_GUILD_ID

const body = (await loadCommands()).map((c) => c.data.toJSON())
const rest = new REST().setToken(token)
const route = guildId
  ? Routes.applicationGuildCommands(clientId, guildId)
  : Routes.applicationCommands(clientId)

await rest.put(route, { body })
console.log(`✔ ${body.length} commande(s) déployée(s) ${guildId ? `sur la guilde ${guildId}` : '(global)'}`)
