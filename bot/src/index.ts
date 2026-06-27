import 'dotenv/config'
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { loadCommands } from './lib/loaders.js'
import type { Command } from './lib/command.js'
import { onReady } from './events/ready.js'
import { onInteraction } from './events/interactionCreate.js'
import { onGuildMemberAdd } from './events/guildMemberAdd.js'

const token = process.env.DISCORD_TOKEN
if (!token) {
  console.error('DISCORD_TOKEN manquant — copie bot/.env.example en bot/.env')
  process.exit(1)
}

// GuildMembers est un intent PRIVILÉGIÉ (à activer dans le portail développeur) — requis pour l'autorole.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
})

const commands = new Collection<string, Command>()
for (const cmd of await loadCommands()) commands.set(cmd.data.name, cmd)
console.log(`[kessoku-bot] ${commands.size} commande(s) chargée(s) : ${[...commands.keys()].join(', ')}`)

client.once(Events.ClientReady, onReady)
client.on(Events.InteractionCreate, (i) => onInteraction(i, commands))
client.on(Events.GuildMemberAdd, onGuildMemberAdd)

process.on('uncaughtException', (e) => console.error('[uncaughtException]', e))
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e))

await client.login(token)
