// ──────────────────────────────────────────────────────────────────────────
// Protocole de synchronisation collaborative (côté client).
// Les changements sont diffusés sous forme d'« ops » granulaires (upsert/delete)
// fusionnées en last-write-wins grâce au champ updatedAt de chaque entité.
// Le serveur ne fait que relayer ces ops (il n'interprète pas les données).
// ──────────────────────────────────────────────────────────────────────────

import { emptyFestival } from '@/data/defaults'
import type { AppData, FestivalEvent, RootData } from './types'

export type Coll =
  | 'event'
  | 'festival'
  | 'slots'
  | 'artists'
  | 'materials'
  | 'tasks'
  | 'members'
  | 'volunteers'
const ENTITY_COLLS = ['slots', 'artists', 'materials', 'tasks', 'members', 'volunteers'] as const
type EntityColl = (typeof ENTITY_COLLS)[number]

export interface Op {
  kind: 'upsert' | 'delete'
  coll: Coll
  eventId: string
  id?: string
  updatedAt?: string
  payload?: unknown
}

interface Identified {
  id: string
  updatedAt: string
}

function maxIso(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? ''
  if (!b) return a
  return a >= b ? a : b
}

function byId<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((e) => [e.id, e]))
}

function emptyData(): AppData {
  return {
    festival: { ...emptyFestival },
    slots: [],
    artists: [],
    materials: [],
    tasks: [],
    members: [],
    volunteers: [],
  }
}

/** Calcule les ops à envoyer pour passer de `prev` à `next`. */
export function diffRoots(prev: RootData, next: RootData): Op[] {
  const ops: Op[] = []
  const prevEv = byId(prev.events)
  const nextEv = byId(next.events)

  for (const id of prevEv.keys()) {
    if (!nextEv.has(id)) ops.push({ kind: 'delete', coll: 'event', eventId: id })
  }

  for (const ev of next.events) {
    const prevE = prevEv.get(ev.id)
    if (!prevE) {
      ops.push(...eventToOps(ev))
      continue
    }
    if (JSON.stringify(prevE.data.festival) !== JSON.stringify(ev.data.festival)) {
      ops.push({ kind: 'upsert', coll: 'festival', eventId: ev.id, updatedAt: ev.updatedAt, payload: ev.data.festival })
    }
    for (const coll of ENTITY_COLLS) {
      const pm = byId((prevE.data[coll] as Identified[]) ?? [])
      const nm = byId((ev.data[coll] as Identified[]) ?? [])
      for (const id of pm.keys()) {
        if (!nm.has(id)) ops.push({ kind: 'delete', coll, eventId: ev.id, id })
      }
      for (const e of (ev.data[coll] as Identified[]) ?? []) {
        const p = pm.get(e.id)
        if (!p || p.updatedAt !== e.updatedAt) {
          ops.push({ kind: 'upsert', coll, eventId: ev.id, id: e.id, updatedAt: e.updatedAt, payload: e })
        }
      }
    }
  }
  return ops
}

/** Représente un événement complet sous forme d'ops (création / snapshot). */
function eventToOps(ev: FestivalEvent): Op[] {
  const ops: Op[] = [
    {
      kind: 'upsert',
      coll: 'event',
      eventId: ev.id,
      updatedAt: ev.updatedAt,
      payload: { id: ev.id, createdAt: ev.createdAt, updatedAt: ev.updatedAt },
    },
    { kind: 'upsert', coll: 'festival', eventId: ev.id, updatedAt: ev.updatedAt, payload: ev.data.festival },
  ]
  for (const coll of ENTITY_COLLS) {
    for (const e of (ev.data[coll] as Identified[]) ?? []) {
      ops.push({ kind: 'upsert', coll, eventId: ev.id, id: e.id, updatedAt: e.updatedAt, payload: e })
    }
  }
  return ops
}

/** Sérialise tout l'état en ops (pour envoyer un snapshot complet à un pair). */
export function rootToOps(root: RootData): Op[] {
  return root.events.flatMap(eventToOps)
}

/** Applique des ops distantes à la liste d'événements (last-write-wins). */
export function applyOpsToEvents(events: FestivalEvent[], ops: Op[]): FestivalEvent[] {
  const map = new Map<string, FestivalEvent>(events.map((e) => [e.id, { ...e, data: { ...e.data } }]))

  const ensure = (eventId: string, stamp?: string): FestivalEvent => {
    let ev = map.get(eventId)
    if (!ev) {
      ev = { id: eventId, data: emptyData(), createdAt: stamp ?? '', updatedAt: stamp ?? '' }
      map.set(eventId, ev)
    }
    return ev
  }

  for (const op of ops) {
    if (op.coll === 'event') {
      if (op.kind === 'delete') {
        map.delete(op.eventId)
      } else {
        const ev = ensure(op.eventId, op.updatedAt)
        ev.updatedAt = maxIso(ev.updatedAt, op.updatedAt)
        const meta = op.payload as { createdAt?: string } | undefined
        if (meta?.createdAt && !ev.createdAt) ev.createdAt = meta.createdAt
      }
      continue
    }

    const ev = ensure(op.eventId, op.updatedAt)

    if (op.coll === 'festival') {
      // LWW par updatedAt de l'événement.
      if (!ev.updatedAt || (op.updatedAt ?? '') >= ev.updatedAt) {
        ev.data = { ...ev.data, festival: op.payload as AppData['festival'] }
      }
      ev.updatedAt = maxIso(ev.updatedAt, op.updatedAt)
      continue
    }

    const coll = op.coll as EntityColl
    const arr = (ev.data[coll] as Identified[]) ?? []
    if (op.kind === 'delete') {
      ev.data = { ...ev.data, [coll]: arr.filter((x) => x.id !== op.id) } as AppData
    } else {
      const idx = arr.findIndex((x) => x.id === op.id)
      if (idx < 0) {
        ev.data = { ...ev.data, [coll]: [...arr, op.payload as Identified] } as AppData
      } else if ((op.updatedAt ?? '') >= arr[idx].updatedAt) {
        const nextArr = arr.slice()
        nextArr[idx] = op.payload as Identified
        ev.data = { ...ev.data, [coll]: nextArr } as AppData
      }
      ev.updatedAt = maxIso(ev.updatedAt, op.updatedAt)
    }
  }

  return [...map.values()]
}
