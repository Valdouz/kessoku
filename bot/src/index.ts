import 'dotenv/config'
import { Client, Collection, Events, GatewayIntentBits, Partials } from 'discord.js'
import { loadCommands } from './lib/loaders.js'
import type { Command } from './lib/command.js'
import { onReady } from './events/ready.js'
import { onInteraction } from './events/interactionCreate.js'
import { onGuildMemberAdd } from './events/guildMemberAdd.js'
import { onReactionAdd } from './events/messageReactionAdd.js'
import { onReactionRemove } from './events/messageReactionRemove.js'

const token = process.env.DISCORD_TOKEN
if (!token) {
  console.error('DISCORD_TOKEN manquant — copie bot/.env.example en bot/.env')
  process.exit(1)
}

// GuildMembers est un intent PRIVILÉGIÉ (à activer dans le portail développeur) — requis pour l'autorole.
// GuildMessageReactions + Partials : nécessaires aux reaction roles (réactions sur d'anciens messages).
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

const commands = new Collection<string, Command>()
for (const cmd of await loadCommands()) commands.set(cmd.data.name, cmd)
console.log(`[kessoku-bot] ${commands.size} commande(s) chargée(s) : ${[...commands.keys()].join(', ')}`)

client.once(Events.ClientReady, onReady)
client.on(Events.InteractionCreate, (i) => onInteraction(i, commands))
client.on(Events.GuildMemberAdd, onGuildMemberAdd)
client.on(Events.MessageReactionAdd, (reaction, user) => onReactionAdd(reaction, user))
client.on(Events.MessageReactionRemove, (reaction, user) => onReactionRemove(reaction, user))

process.on('uncaughtException', (e) => console.error('[uncaughtException]', e))
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e))

await client.login(token)
