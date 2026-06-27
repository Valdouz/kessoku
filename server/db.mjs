// Base SQLite : utilisateurs (auth) + espaces de travail (données du festival).
// Un fichier unique dans le volume de données — simple à sauvegarder.

import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = process.env.DATA_DIR || './data'
mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(join(DATA_DIR, 'kessoku.db'))
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token_version INTEGER NOT NULL DEFAULT 0,
    event_access TEXT NOT NULL DEFAULT '*',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workspaces (
    room TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)
// Migrations idempotentes pour les bases créées avant ces colonnes.
try {
  db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0')
} catch {
  /* colonne déjà présente */
}
try {
  db.exec("ALTER TABLE users ADD COLUMN event_access TEXT NOT NULL DEFAULT '*'")
} catch {
  /* colonne déjà présente */
}
try {
  db.exec('ALTER TABLE users ADD COLUMN discord_id TEXT')
} catch {
  /* colonne déjà présente */
}
// Un compte Discord ne peut être lié qu'à un seul compte du site (les NULL restent libres).
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_discord ON users(discord_id) WHERE discord_id IS NOT NULL')

// ── Utilisateurs ─────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 10

export function countUsers() {
  return db.prepare('SELECT COUNT(*) AS c FROM users').get().c
}
export function getUserByUsername(username) {
  // Insensible à la casse : « Admin » (autocapitalisation Safari) trouve « admin ».
  return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username)
}
export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}
export function listUsers() {
  return db.prepare('SELECT id, username, role, event_access, created_at FROM users ORDER BY username').all()
}
export function createUser(username, password, role = 'member', eventAccess = '*') {
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
  const created = new Date().toISOString()
  const access = normalizeAccess(eventAccess)
  const info = db
    .prepare(
      'INSERT INTO users (username, password_hash, role, event_access, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(username, hash, role, access, created)
  return { id: info.lastInsertRowid, username, role, event_access: access, created_at: created }
}

/** Définit le périmètre d'accès d'un compte : '*' (tout) ou liste d'ids d'événements. */
export function setEventAccess(id, eventAccess) {
  db.prepare('UPDATE users SET event_access = ? WHERE id = ?').run(normalizeAccess(eventAccess), id)
}
/** Ajoute un événement au périmètre d'un compte restreint (ex. il vient de le créer). */
export function grantEventAccess(id, eventId) {
  const u = getUserById(id)
  if (!u || u.event_access === '*') return
  let list = []
  try {
    list = JSON.parse(u.event_access)
  } catch {
    list = []
  }
  if (!Array.isArray(list)) list = []
  if (!list.includes(eventId)) {
    list.push(eventId)
    setEventAccess(id, JSON.stringify(list))
  }
}
/** Normalise une valeur d'accès en chaîne stockable. */
function normalizeAccess(value) {
  if (value === '*' || value == null) return '*'
  if (Array.isArray(value)) return JSON.stringify(value.filter((x) => typeof x === 'string'))
  if (typeof value === 'string') {
    if (value === '*') return '*'
    try {
      const arr = JSON.parse(value)
      if (Array.isArray(arr)) return JSON.stringify(arr.filter((x) => typeof x === 'string'))
    } catch {
      /* ignore */
    }
  }
  return '*'
}
export function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

// ── Liaison Discord ──────────────────────────────────────────────────────────
export function getUserByDiscordId(discordId) {
  return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId)
}
export function setDiscordId(userId, discordId) {
  db.prepare('UPDATE users SET discord_id = ? WHERE id = ?').run(discordId, userId)
}
export function clearDiscordId(userId) {
  db.prepare('UPDATE users SET discord_id = NULL WHERE id = ?').run(userId)
}
export function setRole(id, role) {
  const r = role === 'admin' ? 'admin' : 'member'
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(r, id)
}
export function countAdmins() {
  return db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c
}
export function setPassword(id, password) {
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
  // On incrémente token_version : tous les anciens jetons de ce compte deviennent invalides.
  db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?').run(hash, id)
}
export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

/** Crée un admin au premier démarrage si la base est vide. */
export function seedAdmin() {
  if (countUsers() > 0) return null
  const username = (process.env.ADMIN_USERNAME || 'admin').trim() || 'admin'
  const envPw = (process.env.ADMIN_PASSWORD || '').trim()
  const password = envPw || randomPassword()
  createUser(username, password, 'admin')
  return { username, password, generated: !envPw }
}
function randomPassword() {
  // CSPRNG (≈24 caractères) — jamais de Math.random pour un secret.
  return randomBytes(18).toString('base64url')
}

// ── Espaces de travail (données) ─────────────────────────────────────────────
export function getWorkspace(room) {
  const row = db.prepare('SELECT data FROM workspaces WHERE room = ?').get(room)
  if (!row) return null
  try {
    return JSON.parse(row.data)
  } catch {
    return null
  }
}
export function saveWorkspace(room, root) {
  const data = JSON.stringify(root)
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO workspaces (room, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(room) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(room, data, now)
}
