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
  CREATE TABLE IF NOT EXISTS reaction_panels (
    message_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reaction_roles (
    message_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (message_id, emoji)
  );
  -- Cues du « jour J » déjà postés (anti-doublon, survit aux redémarrages).
  CREATE TABLE IF NOT EXISTS live_fired (
    guild_id TEXT NOT NULL,
    cue_key TEXT NOT NULL,
    fired_at TEXT NOT NULL,
    PRIMARY KEY (guild_id, cue_key)
  );
`)

// Migrations additives idempotentes (colonnes ajoutées après coup).
function ensureColumn(table: string, column: string, decl: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${decl}`)
}
ensureColumn('guild_settings', 'welcome_channel_id', 'welcome_channel_id TEXT')
ensureColumn('guild_settings', 'announce_channel_id', 'announce_channel_id TEXT')
ensureColumn('guild_settings', 'last_reminder', 'last_reminder TEXT')
// Repère (ms) du dernier membre accueilli — sert au rattrapage après une coupure.
ensureColumn('guild_settings', 'welcome_last_ts', 'welcome_last_ts TEXT')
// Mode « jour J » : salon des cues, rôle plateau à pinger, préavis (min), activation.
ensureColumn('guild_settings', 'live_channel_id', 'live_channel_id TEXT')
ensureColumn('guild_settings', 'live_role_id', 'live_role_id TEXT')
ensureColumn('guild_settings', 'live_lead_min', 'live_lead_min TEXT')
ensureColumn('guild_settings', 'live_enabled', 'live_enabled TEXT')

export interface GuildSettings {
  guild_id: string
  autorole_id: string | null
  autorole_emoji: string | null
  welcome_channel_id: string | null
  announce_channel_id: string | null
  last_reminder: string | null
  welcome_last_ts: string | null
  live_channel_id: string | null
  live_role_id: string | null
  live_lead_min: string | null
  live_enabled: string | null
  updated_at: string
}

export function getGuild(guildId: string): GuildSettings | undefined {
  return db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId) as
    | GuildSettings
    | undefined
}

// Met à jour UN champ de guild_settings (crée la ligne au besoin).
function setField(guildId: string, column: string, value: string | null): void {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO guild_settings (guild_id, ${column}, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET ${column} = excluded.${column}, updated_at = excluded.updated_at`,
  ).run(guildId, value, now)
}

export const setWelcomeChannel = (guildId: string, channelId: string | null): void =>
  setField(guildId, 'welcome_channel_id', channelId)
export const setWelcomeWatermark = (guildId: string, ms: number): void =>
  setField(guildId, 'welcome_last_ts', String(ms))
export const setAnnounceChannel = (guildId: string, channelId: string | null): void =>
  setField(guildId, 'announce_channel_id', channelId)
export const setLastReminder = (guildId: string, value: string | null): void =>
  setField(guildId, 'last_reminder', value)

/** Guildes ayant un salon d'annonces configuré (pour le planificateur de rappels). */
export function listAnnounceGuilds(): { guild_id: string; announce_channel_id: string; last_reminder: string | null }[] {
  return db
    .prepare('SELECT guild_id, announce_channel_id, last_reminder FROM guild_settings WHERE announce_channel_id IS NOT NULL')
    .all() as { guild_id: string; announce_channel_id: string; last_reminder: string | null }[]
}

// ── Mode « jour J » (cues temps réel du conducteur) ──────────────────────────
export const setLiveChannel = (guildId: string, channelId: string | null): void =>
  setField(guildId, 'live_channel_id', channelId)
export const setLiveRole = (guildId: string, roleId: string | null): void =>
  setField(guildId, 'live_role_id', roleId)
export const setLiveLead = (guildId: string, min: number): void =>
  setField(guildId, 'live_lead_min', String(min))
export const setLiveEnabled = (guildId: string, on: boolean): void =>
  setField(guildId, 'live_enabled', on ? '1' : '0')

export interface LiveGuild {
  guild_id: string
  live_channel_id: string
  live_role_id: string | null
  live_lead_min: string | null
}
/** Guildes avec le mode jour J activé et un salon configuré. */
export function listLiveGuilds(): LiveGuild[] {
  return db
    .prepare(
      `SELECT guild_id, live_channel_id, live_role_id, live_lead_min FROM guild_settings
       WHERE live_enabled = '1' AND live_channel_id IS NOT NULL`,
    )
    .all() as LiveGuild[]
}

export function hasFired(guildId: string, cueKey: string): boolean {
  return Boolean(
    db.prepare('SELECT 1 FROM live_fired WHERE guild_id = ? AND cue_key = ?').get(guildId, cueKey),
  )
}
export function markFired(guildId: string, cueKey: string): void {
  db.prepare('INSERT OR IGNORE INTO live_fired (guild_id, cue_key, fired_at) VALUES (?, ?, ?)').run(
    guildId,
    cueKey,
    new Date().toISOString(),
  )
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

// ── Reaction roles ───────────────────────────────────────────────────────────
export interface ReactionPanel {
  message_id: string
  guild_id: string
  channel_id: string
  title: string | null
  description: string | null
  created_at: string
}
export interface ReactionRole {
  message_id: string
  emoji: string
  role_id: string
}

export function createPanel(
  guildId: string,
  channelId: string,
  messageId: string,
  title: string | null,
  description: string | null,
): void {
  db.prepare(
    `INSERT INTO reaction_panels (message_id, guild_id, channel_id, title, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(messageId, guildId, channelId, title, description, new Date().toISOString())
}

/** Dernier panneau créé dans un salon (cible par défaut de /reactionrole add). */
export function latestPanelInChannel(guildId: string, channelId: string): ReactionPanel | undefined {
  return db
    .prepare(
      `SELECT * FROM reaction_panels WHERE guild_id = ? AND channel_id = ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(guildId, channelId) as ReactionPanel | undefined
}

export function getPanel(messageId: string): ReactionPanel | undefined {
  return db.prepare('SELECT * FROM reaction_panels WHERE message_id = ?').get(messageId) as
    | ReactionPanel
    | undefined
}

export function addReactionRole(messageId: string, emoji: string, roleId: string): void {
  db.prepare(
    `INSERT INTO reaction_roles (message_id, emoji, role_id) VALUES (?, ?, ?)
     ON CONFLICT(message_id, emoji) DO UPDATE SET role_id = excluded.role_id`,
  ).run(messageId, emoji, roleId)
}

export function listReactionRoles(messageId: string): ReactionRole[] {
  return db
    .prepare('SELECT * FROM reaction_roles WHERE message_id = ?')
    .all(messageId) as ReactionRole[]
}

export function removeReactionRoleByRole(messageId: string, roleId: string): string | undefined {
  const row = db
    .prepare('SELECT emoji FROM reaction_roles WHERE message_id = ? AND role_id = ?')
    .get(messageId, roleId) as { emoji: string } | undefined
  if (row) db.prepare('DELETE FROM reaction_roles WHERE message_id = ? AND role_id = ?').run(messageId, roleId)
  return row?.emoji
}

export function panelEmojis(messageId: string): Set<string> {
  return new Set(listReactionRoles(messageId).map((r) => r.emoji))
}
