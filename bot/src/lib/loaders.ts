// Handler de commandes : charge automatiquement tous les modules de src/commands.
import { readdirSync } from 'node:fs'
import type { Command } from './command.js'

export async function loadCommands(): Promise<Command[]> {
  const dir = new URL('../commands/', import.meta.url)
  const files = readdirSync(dir).filter((f) => /\.(js|ts)$/.test(f) && !f.endsWith('.d.ts'))
  const out: Command[] = []
  for (const file of files) {
    const mod = (await import(new URL(file, dir).href)) as {
      command?: Command
      default?: Command
    }
    const cmd = mod.command ?? mod.default
    if (cmd && typeof cmd === 'object' && 'data' in cmd && 'execute' in cmd) out.push(cmd)
  }
  return out
}
