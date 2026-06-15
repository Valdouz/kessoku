// ──────────────────────────────────────────────────────────────────────────
// Store Kessoku — local-first, MULTI-ÉVÉNEMENTS (zustand + persistance).
// La racine contient une liste d'événements (concerts/festivals) + l'actif.
// Les sélecteurs et actions de collection gardent la MÊME signature qu'avant :
// ils opèrent simplement sur l'événement courant -> les modules sont inchangés.
// ──────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { newId, nowISO } from './ids'
import { addMinutes, timeToMinutes } from '@/lib/time'
import {
  emptyFestival,
  makeArtist,
  makeEvent,
  makeMaterial,
  makeMember,
  makeSlot,
  makeTask,
} from '@/data/defaults'
import { seedRoot } from '@/data/seed'
import { applyOpsToEvents, type Op } from './syncProtocol'
import type {
  AppData,
  Artist,
  ExportFile,
  Festival,
  FestivalEvent,
  ID,
  MaterialItem,
  Member,
  RootData,
  Slot,
  Task,
} from './types'

export const SCHEMA_VERSION = 2
const STORAGE_KEY = 'kessoku.v1'
const BACKUP_KEY = 'kessoku.backup.v1'

/** Collections copiables d'un événement vers un autre. */
export interface CopyOptions {
  copyFromEventId?: ID
  copy?: {
    materials?: boolean
    members?: boolean
    tasks?: boolean
    slots?: boolean
    artists?: boolean
  }
}

interface StoreState {
  events: FestivalEvent[]
  currentEventId: ID
  lastModified: string

  // ── Événements ──────────────────────────────────────────────────────────
  createEvent: (festival?: Partial<Festival>, options?: CopyOptions) => FestivalEvent
  switchEvent: (id: ID) => void
  duplicateEvent: (id: ID) => FestivalEvent | null
  removeEvent: (id: ID) => void

  // Festival (événement courant, singleton)
  updateFestival: (patch: Partial<Festival>) => void

  // Conducteur
  addSlot: (input?: Partial<Slot>) => Slot
  updateSlot: (id: ID, patch: Partial<Slot>) => void
  removeSlot: (id: ID) => void
  reorderSlots: (orderedIds: ID[]) => void
  recalibrateSlots: (startTime: string) => void

  // Artistes
  addArtist: (input?: Partial<Artist>) => Artist
  updateArtist: (id: ID, patch: Partial<Artist>) => void
  removeArtist: (id: ID) => void

  // Matériel
  addMaterial: (input?: Partial<MaterialItem>) => MaterialItem
  updateMaterial: (id: ID, patch: Partial<MaterialItem>) => void
  removeMaterial: (id: ID) => void

  // Tâches
  addTask: (input?: Partial<Task>) => Task
  updateTask: (id: ID, patch: Partial<Task>) => void
  removeTask: (id: ID) => void
  reorderTasks: (orderedIds: ID[]) => void

  // Équipe
  addMember: (input?: Partial<Member>) => Member
  updateMember: (id: ID, patch: Partial<Member>) => void
  removeMember: (id: ID) => void

  // Données de l'événement courant
  replaceData: (data: AppData) => void
  resetData: () => void
  exportFile: () => ExportFile

  // Synchronisation collaborative (applique des ops distantes, sans ré-émettre)
  applyRemoteOps: (ops: Op[]) => void
}

// ── Helpers internes ─────────────────────────────────────────────────────────
const EMPTY: never[] = [] // référence stable pour les fallbacks (évite les re-rendus)

function findEvent(s: { events: FestivalEvent[]; currentEventId: ID }): FestivalEvent | undefined {
  return s.events.find((e) => e.id === s.currentEventId) ?? s.events[0]
}

function patchIn<T extends { id: ID; createdAt: string; updatedAt: string }>(
  list: T[],
  id: ID,
  patch: Partial<T>,
): T[] {
  return list.map((e) =>
    e.id === id ? { ...e, ...patch, id: e.id, createdAt: e.createdAt, updatedAt: nowISO() } : e,
  )
}

// PRÉ-REQUIS : orderedIds contient l'intégralité des ids de `list`.
function reorder<T extends { id: ID; order: number }>(list: T[], orderedIds: ID[]): T[] {
  const rank = new Map(orderedIds.map((id, i) => [id, i]))
  const stamp = nowISO()
  return list
    .map((e) => (rank.has(e.id) ? { ...e, order: rank.get(e.id)!, updatedAt: stamp } : e))
    .sort((a, b) => a.order - b.order)
}

// Recale les créneaux en chaîne depuis `startTime` (ordre = heure puis order).
function recalibrate(slots: Slot[], startTime: string): Slot[] {
  const ordered = [...slots].sort((a, b) => {
    const ta = timeToMinutes(a.startTime)
    const tb = timeToMinutes(b.startTime)
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    if (ta !== tb) return ta - tb
    return a.order - b.order
  })
  const stamp = nowISO()
  let cursor = startTime
  const byId = new Map<ID, Slot>()
  ordered.forEach((sl, i) => {
    byId.set(sl.id, { ...sl, startTime: cursor, order: i, updatedAt: stamp })
    cursor = addMinutes(cursor, Number.isFinite(sl.durationMin) ? sl.durationMin : 0)
  })
  return slots.map((sl) => byId.get(sl.id) ?? sl)
}

// Clone les collections choisies avec de NOUVEAUX ids (réutilisation de données).
function cloneData(src: AppData, pick: NonNullable<CopyOptions['copy']>): Partial<AppData> {
  const stamp = nowISO()
  const out: Partial<AppData> = {}
  const remap = new Map<ID, ID>()
  if (pick.artists) {
    out.artists = src.artists.map((a) => {
      const id = newId()
      remap.set(a.id, id)
      return { ...a, id, createdAt: stamp, updatedAt: stamp }
    })
  }
  if (pick.slots) {
    out.slots = src.slots.map((sl) => ({
      ...sl,
      id: newId(),
      artistId: sl.artistId ? remap.get(sl.artistId) : undefined,
      createdAt: stamp,
      updatedAt: stamp,
    }))
  }
  if (pick.materials) {
    out.materials = src.materials.map((m) => ({ ...m, id: newId(), createdAt: stamp, updatedAt: stamp }))
  }
  if (pick.members) {
    out.members = src.members.map((m) => ({ ...m, id: newId(), createdAt: stamp, updatedAt: stamp }))
  }
  if (pick.tasks) {
    out.tasks = src.tasks.map((t) => ({ ...t, id: newId(), done: false, createdAt: stamp, updatedAt: stamp }))
  }
  return out
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      // Applique une transformation aux données de l'événement courant.
      const mutate = (fn: (data: AppData) => Partial<AppData>) =>
        set((s) => {
          const stamp = nowISO()
          return {
            events: s.events.map((e) =>
              e.id === s.currentEventId ? { ...e, data: { ...e.data, ...fn(e.data) }, updatedAt: stamp } : e,
            ),
            lastModified: stamp,
          }
        })
      const curData = (): AppData | undefined => findEvent(get())?.data

      return {
        events: seedRoot.events,
        currentEventId: seedRoot.currentEventId,
        lastModified: nowISO(),

        // ── Événements ─────────────────────────────────────────────────────
        createEvent: (festival = {}, options) => {
          let dataPatch: Partial<AppData> = {}
          if (options?.copyFromEventId && options.copy) {
            const src = get().events.find((e) => e.id === options.copyFromEventId)
            if (src) dataPatch = cloneData(src.data, options.copy)
          }
          const event = makeEvent(festival, dataPatch)
          set((s) => ({ events: [...s.events, event], currentEventId: event.id, lastModified: nowISO() }))
          return event
        },
        switchEvent: (id) =>
          set((s) => (s.events.some((e) => e.id === id) ? { currentEventId: id } : {})),
        duplicateEvent: (id) => {
          const src = get().events.find((e) => e.id === id)
          if (!src) return null
          const event = makeEvent(
            { ...src.data.festival, name: `${src.data.festival.name} (copie)` },
            cloneData(src.data, { materials: true, members: true, tasks: true, slots: true, artists: true }),
          )
          set((s) => ({ events: [...s.events, event], currentEventId: event.id, lastModified: nowISO() }))
          return event
        },
        removeEvent: (id) =>
          set((s) => {
            if (s.events.length <= 1) return {} // on garde toujours au moins un événement
            const events = s.events.filter((e) => e.id !== id)
            const currentEventId = s.currentEventId === id ? events[0].id : s.currentEventId
            return { events, currentEventId, lastModified: nowISO() }
          }),

        updateFestival: (patch) => mutate((d) => ({ festival: { ...d.festival, ...patch } })),

        // ── Conducteur ─────────────────────────────────────────────────────
        addSlot: (input) => {
          const order = (curData()?.slots ?? []).reduce((m, s) => Math.max(m, s.order + 1), 0)
          const slot = makeSlot({ order, ...input })
          mutate((d) => ({ slots: [...d.slots, slot] }))
          return slot
        },
        updateSlot: (id, patch) => mutate((d) => ({ slots: patchIn(d.slots, id, patch) })),
        removeSlot: (id) => mutate((d) => ({ slots: d.slots.filter((x) => x.id !== id) })),
        reorderSlots: (ids) => mutate((d) => ({ slots: reorder(d.slots, ids) })),
        recalibrateSlots: (startTime) => mutate((d) => ({ slots: recalibrate(d.slots, startTime) })),

        // ── Artistes ───────────────────────────────────────────────────────
        addArtist: (input) => {
          const artist = makeArtist(input)
          mutate((d) => ({ artists: [...d.artists, artist] }))
          return artist
        },
        updateArtist: (id, patch) => mutate((d) => ({ artists: patchIn(d.artists, id, patch) })),
        removeArtist: (id) =>
          mutate((d) => ({
            artists: d.artists.filter((x) => x.id !== id),
            slots: d.slots.map((sl) => (sl.artistId === id ? { ...sl, artistId: undefined } : sl)),
          })),

        // ── Matériel ───────────────────────────────────────────────────────
        addMaterial: (input) => {
          const item = makeMaterial(input)
          mutate((d) => ({ materials: [...d.materials, item] }))
          return item
        },
        updateMaterial: (id, patch) => mutate((d) => ({ materials: patchIn(d.materials, id, patch) })),
        removeMaterial: (id) => mutate((d) => ({ materials: d.materials.filter((x) => x.id !== id) })),

        // ── Tâches ─────────────────────────────────────────────────────────
        addTask: (input) => {
          const order = (curData()?.tasks ?? []).reduce((m, t) => Math.max(m, t.order + 1), 0)
          const task = makeTask({ order, ...input })
          mutate((d) => ({ tasks: [...d.tasks, task] }))
          return task
        },
        updateTask: (id, patch) => mutate((d) => ({ tasks: patchIn(d.tasks, id, patch) })),
        removeTask: (id) => mutate((d) => ({ tasks: d.tasks.filter((x) => x.id !== id) })),
        reorderTasks: (ids) => mutate((d) => ({ tasks: reorder(d.tasks, ids) })),

        // ── Équipe ─────────────────────────────────────────────────────────
        addMember: (input) => {
          const member = makeMember(input)
          mutate((d) => ({ members: [...d.members, member] }))
          return member
        },
        updateMember: (id, patch) => mutate((d) => ({ members: patchIn(d.members, id, patch) })),
        removeMember: (id) => mutate((d) => ({ members: d.members.filter((x) => x.id !== id) })),

        // ── Données de l'événement courant ─────────────────────────────────
        replaceData: (data) =>
          set((s) => ({
            events: s.events.map((e) =>
              e.id === s.currentEventId ? { ...e, data, updatedAt: nowISO() } : e,
            ),
            lastModified: nowISO(),
          })),
        resetData: () =>
          set(() => ({
            events: seedRoot.events,
            currentEventId: seedRoot.currentEventId,
            lastModified: nowISO(),
          })),
        exportFile: () => ({
          app: 'kessoku',
          schemaVersion: SCHEMA_VERSION,
          exportedAt: nowISO(),
          data: findEvent(get())?.data ?? makeEvent().data,
        }),

        applyRemoteOps: (ops) =>
          set((s) => {
            const events = applyOpsToEvents(s.events, ops)
            if (events.length === 0) return { lastModified: nowISO() }
            const currentEventId = events.some((e) => e.id === s.currentEventId)
              ? s.currentEventId
              : events[0].id
            return { events, currentEventId, lastModified: nowISO() }
          }),
      }
    },
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        events: s.events,
        currentEventId: s.currentEventId,
        lastModified: s.lastModified,
      }),
      // Migration v1 (mono-événement) -> v2 (multi). NON DESTRUCTIVE :
      // on copie d'abord l'ancien état dans une clé de secours.
      migrate: (persisted, version): RootData & { lastModified: string } => {
        const p = persisted as Record<string, unknown> | null
        // Déjà au format v2 : passthrough.
        if (p && Array.isArray(p.events)) {
          return p as unknown as RootData & { lastModified: string }
        }
        // v1 : { data: AppData, lastModified }
        const data = p?.data as AppData | undefined
        if (version < 2 && data && data.festival) {
          try {
            if (typeof localStorage !== 'undefined' && !localStorage.getItem(BACKUP_KEY)) {
              localStorage.setItem(
                BACKUP_KEY,
                JSON.stringify({ savedAt: nowISO(), schemaVersion: 1, state: p }),
              )
            }
          } catch {
            /* sauvegarde best-effort */
          }
          const stamp = (p?.lastModified as string) || nowISO()
          const event: FestivalEvent = {
            id: newId(),
            data: { ...data, festival: { ...data.festival, kind: data.festival.kind || 'festival' } },
            createdAt: stamp,
            updatedAt: stamp,
          }
          return { events: [event], currentEventId: event.id, lastModified: stamp }
        }
        // Cas inattendu : on repart du seed.
        return { ...seedRoot, lastModified: nowISO() }
      },
    },
  ),
)

// ── Sélecteurs pratiques (inchangés pour les modules) ────────────────────────
export const useFestival = (): Festival =>
  useStore((s) => findEvent(s)?.data.festival ?? emptyFestival)
export const useSlots = () => useStore((s) => findEvent(s)?.data.slots ?? EMPTY)
export const useArtists = () => useStore((s) => findEvent(s)?.data.artists ?? EMPTY)
export const useMaterials = () => useStore((s) => findEvent(s)?.data.materials ?? EMPTY)
export const useTasks = () => useStore((s) => findEvent(s)?.data.tasks ?? EMPTY)
export const useMembers = () => useStore((s) => findEvent(s)?.data.members ?? EMPTY)
export const useLastModified = () => useStore((s) => s.lastModified)

// ── Sélecteurs multi-événements ──────────────────────────────────────────────
export const useEvents = () => useStore((s) => s.events)
export const useCurrentEventId = () => useStore((s) => s.currentEventId)
