// Export / import du fichier de données (partage manuel + sauvegarde).
// C'est aussi le moyen "collaboratif" simple en attendant la sync temps réel :
// on exporte un .json et on l'envoie à la régie, qui l'importe.

import type {
  AppData,
  Artist,
  ExportFile,
  MaterialItem,
  Member,
  MemberRole,
  Slot,
  Task,
  Volunteer,
} from './types'
import { SCHEMA_VERSION } from './store'
import { BRAND } from '@/brand'
import { newId, nowISO } from './ids'
import {
  ARTIST_KINDS,
  ARTIST_STATUS,
  MATERIAL_STATUS,
  MEMBER_ROLES,
  SLOT_TYPES,
  TASK_PHASES,
  TASK_PRIORITIES,
  VOLUNTEER_STATUS,
} from './labels'

/** Déclenche le téléchargement d'un fichier JSON dans le navigateur. */
export function downloadJSON(payload: ExportFile, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const COLLECTIONS = ['slots', 'artists', 'materials', 'tasks', 'members'] as const

// ── Helpers de normalisation (sanitisation à l'import) ───────────────────────

/** Renvoie un id string non vide, en régénérant + dédupliquant si besoin. */
function safeId(raw: unknown, seen: Set<string>): string {
  let id = typeof raw === 'string' && raw.trim() !== '' ? raw : newId()
  while (seen.has(id)) id = newId()
  seen.add(id)
  return id
}

/** Restaure des timestamps string valides (sinon « maintenant »). */
function safeStamps(e: Record<string, unknown>): { createdAt: string; updatedAt: string } {
  const now = nowISO()
  return {
    createdAt: typeof e.createdAt === 'string' ? e.createdAt : now,
    updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : now,
  }
}

/** Ramène une clé d'enum inconnue sur une valeur de repli sûre. */
function safeEnum<T extends string>(value: unknown, record: Record<T, unknown>, fallback: T): T {
  return typeof value === 'string' && value in record ? (value as T) : fallback
}

/** Réindexe `order` 0..n-1 en suivant l'ordre `order` existant (NaN en fin). */
function reindexOrder<T extends { order: number }>(coll: T[]): void {
  coll
    .slice()
    .sort(
      (a, b) =>
        (Number.isFinite(a.order) ? a.order : Infinity) -
        (Number.isFinite(b.order) ? b.order : Infinity),
    )
    .forEach((e, i) => {
      e.order = i
    })
}

/** Valide + normalise un objet importé et renvoie des AppData saines, ou lève une erreur. */
export function parseImport(raw: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Fichier illisible (JSON invalide).')
  }
  const obj = parsed as Partial<ExportFile> & Partial<AppData>

  // Accepte soit un ExportFile {app,data}, soit directement un AppData.
  const data = (obj && 'data' in obj && obj.data ? obj.data : obj) as Partial<AppData>

  if (!data || typeof data !== 'object' || !data.festival) {
    throw new Error('Fichier non reconnu (pas de données festival).')
  }
  for (const key of COLLECTIONS) {
    if (!Array.isArray(data[key])) {
      throw new Error(`Fichier incomplet : « ${key} » manquant ou invalide.`)
    }
  }

  // ── Normalisation par collection (empêche des données cassées d'entrer) ────
  // On clone chaque entité (les boucles ci-dessous mutent ces copies, jamais l'entrée).
  const clone = <T>(coll: T[]): T[] => coll.map((e) => ({ ...(e as object) }) as T)
  const slots = clone(data.slots as Slot[])
  const artists = clone(data.artists as Artist[])
  const materials = clone(data.materials as MaterialItem[])
  const tasks = clone(data.tasks as Task[])
  const members = clone(data.members as Member[])
  // Collection optionnelle (ajoutée après coup) : absente des anciens exports.
  const volunteers = clone((Array.isArray(data.volunteers) ? data.volunteers : []) as Volunteer[])

  const seenSlot = new Set<string>()
  for (const s of slots) {
    const r = s as unknown as Record<string, unknown>
    s.id = safeId(r.id, seenSlot)
    Object.assign(s, safeStamps(r))
    s.type = safeEnum(s.type, SLOT_TYPES, 'autre')
    if (!Number.isFinite(s.durationMin)) s.durationMin = 0
  }

  const seenArtist = new Set<string>()
  const artistIds = new Set<string>()
  for (const a of artists) {
    const r = a as unknown as Record<string, unknown>
    a.id = safeId(r.id, seenArtist)
    artistIds.add(a.id)
    Object.assign(a, safeStamps(r))
    a.kind = safeEnum(a.kind, ARTIST_KINDS, 'autre')
    a.status = safeEnum(a.status, ARTIST_STATUS, 'pressenti')
  }

  const seenMaterial = new Set<string>()
  for (const m of materials) {
    const r = m as unknown as Record<string, unknown>
    m.id = safeId(r.id, seenMaterial)
    Object.assign(m, safeStamps(r))
    m.status = safeEnum(m.status, MATERIAL_STATUS, 'a_apporter')
    if (!Number.isFinite(m.qty)) m.qty = 1
  }

  const seenTask = new Set<string>()
  for (const t of tasks) {
    const r = t as unknown as Record<string, unknown>
    t.id = safeId(r.id, seenTask)
    Object.assign(t, safeStamps(r))
    t.phase = safeEnum(t.phase, TASK_PHASES, 'avant')
    t.priority = safeEnum(t.priority, TASK_PRIORITIES, 'normale')
    t.done = Boolean(t.done)
  }

  const seenMember = new Set<string>()
  for (const mb of members) {
    const r = mb as unknown as Record<string, unknown>
    mb.id = safeId(r.id, seenMember)
    Object.assign(mb, safeStamps(r))
    // Multi-rôles : on accepte un tableau `roles` OU l'ancien champ `role`.
    const raw = Array.isArray(r.roles) ? r.roles : r.role != null ? [r.role] : []
    mb.roles = raw.filter((x): x is MemberRole => typeof x === 'string' && x in MEMBER_ROLES)
    delete r.role
    mb.isPartner = Boolean(mb.isPartner)
  }

  const seenVol = new Set<string>()
  for (const v of volunteers) {
    const r = v as unknown as Record<string, unknown>
    v.id = safeId(r.id, seenVol)
    Object.assign(v, safeStamps(r))
    v.status = safeEnum(v.status, VOLUNTEER_STATUS, 'pressenti')
    v.mealIncluded = Boolean(v.mealIncluded)
  }

  // order : réindexation 0..n-1 pour slots et tâches.
  reindexOrder(slots)
  reindexOrder(tasks)

  // artistId orphelin : on délie les créneaux pointant vers un artiste absent.
  for (const s of slots) {
    if (s.artistId && !artistIds.has(s.artistId)) s.artistId = undefined
  }

  return { festival: data.festival, slots, artists, materials, tasks, members, volunteers }
}

/** Slugifie une chaîne pour un nom de fichier (sans accents ni caractères spéciaux). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Nom de fichier d'export horodaté (le préfixe suit BRAND.name). */
export function exportFilename(festivalName: string): string {
  const prefix = slugify(BRAND.name) || 'app'
  const slug = slugify(festivalName)
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`
  return `${prefix}-${slug || 'festival'}-${stamp}.json`
}

export { SCHEMA_VERSION }
