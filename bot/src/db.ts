// Base SQLite du bot (multi-serveurs). Un fichier, ACID — pas de .json.
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = process.env.DATA_DIR || './data'
mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(join(DATA_DIR, 'bot.db'))
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    autorole_id TEXT,
    autorole_emoji TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS role_emojis (
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    PRIMARY KEY (guild_id, role_id)
  );
`)

export interface GuildSettings {
  guild_id: string
  autorole_id: string | null
  autorole_emoji: string | null
  updated_at: string
}

export function getGuild(guildId: string): GuildSettings | undefined {
  return db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId) as
    | GuildSettings
    | undefined
}

export function setAutorole(guildId: string, roleId: string, emoji: string | null): void {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO guild_settings (guild_id, autorole_id, autorole_emoji, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET
       autorole_id = excluded.autorole_id,
       autorole_emoji = excluded.autorole_emoji,
       updated_at = excluded.updated_at`,
  ).run(guildId, roleId, emoji, now)
  if (emoji) {
    db.prepare(
      `INSERT INTO role_emojis (guild_id, role_id, emoji) VALUES (?, ?, ?)
       ON CONFLICT(guild_id, role_id) DO UPDATE SET emoji = excluded.emoji`,
    ).run(guildId, roleId, emoji)
  }
}

export function disableAutorole(guildId: string): void {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO guild_settings (guild_id, autorole_id, autorole_emoji, updated_at)
     VALUES (?, NULL, NULL, ?)
     ON CONFLICT(guild_id) DO UPDATE SET autorole_id = NULL, autorole_emoji = NULL, updated_at = excluded.updated_at`,
  ).run(guildId, now)
}

/** Émojis déjà attribués à des rôles de la guilde (en excluant éventuellement un rôle). */
export function getUsedEmojis(guildId: string, exceptRoleId?: string): Set<string> {
  const rows = db
    .prepare('SELECT role_id, emoji FROM role_emojis WHERE guild_id = ?')
    .all(guildId) as { role_id: string; emoji: string }[]
  return new Set(rows.filter((r) => r.role_id !== exceptRoleId).map((r) => r.emoji))
}
