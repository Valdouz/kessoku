// Logique de synchro côté serveur (port JS de src/lib/syncProtocol.ts).
// Le serveur applique les ops à son document canonique (par room) et sait le
// resérialiser en ops pour l'envoyer aux nouveaux arrivants.

const ENTITY_COLLS = ['slots', 'artists', 'materials', 'tasks', 'members']

function emptyFestival() {
  return {
    kind: 'concert', name: '', edition: '', date: '',
    startTime: '18:00', endTime: '23:00', crewAccessTime: '14:00', loadInDeadline: '17:00',
    venue: '', city: '', context: '', description: '', notes: '',
  }
}
function emptyData() {
  return { festival: emptyFestival(), slots: [], artists: [], materials: [], tasks: [], members: [] }
}

function maxIso(a, b) {
  if (!a) return b || ''
  if (!b) return a
  return a >= b ? a : b
}
function byId(arr) {
  const m = new Map()
  for (const e of arr) m.set(e.id, e)
  return m
}

export function applyOpsToEvents(events, ops) {
  const map = new Map(events.map((e) => [e.id, { ...e, data: { ...e.data } }]))
  const ensure = (eventId, stamp) => {
    let ev = map.get(eventId)
    if (!ev) {
      ev = { id: eventId, data: emptyData(), createdAt: stamp || '', updatedAt: stamp || '' }
      map.set(eventId, ev)
    }
    return ev
  }
  const ALLOWED = new Set(['event', 'festival', ...ENTITY_COLLS])
  for (const op of ops) {
    // Robustesse : on ignore toute op malformée (sinon un message piégé crasherait le serveur).
    if (!op || typeof op !== 'object') continue
    if (op.kind !== 'upsert' && op.kind !== 'delete') continue
    if (!ALLOWED.has(op.coll)) continue
    if (typeof op.eventId !== 'string' || !op.eventId) continue
    if (op.coll === 'event') {
      if (op.kind === 'delete') {
        map.delete(op.eventId)
      } else {
        const ev = ensure(op.eventId, op.updatedAt)
        ev.updatedAt = maxIso(ev.updatedAt, op.updatedAt)
        if (op.payload && op.payload.createdAt && !ev.createdAt) ev.createdAt = op.payload.createdAt
      }
      continue
    }
    const ev = ensure(op.eventId, op.updatedAt)
    if (op.coll === 'festival') {
      if (!ev.updatedAt || (op.updatedAt || '') >= ev.updatedAt) {
        ev.data = { ...ev.data, festival: op.payload }
      }
      ev.updatedAt = maxIso(ev.updatedAt, op.updatedAt)
      continue
    }
    if (!ENTITY_COLLS.includes(op.coll)) continue
    const arr = ev.data[op.coll] || []
    if (op.kind === 'delete') {
      ev.data = { ...ev.data, [op.coll]: arr.filter((x) => x.id !== op.id) }
    } else {
      const idx = arr.findIndex((x) => x.id === op.id)
      if (idx < 0) {
        ev.data = { ...ev.data, [op.coll]: [...arr, op.payload] }
      } else if ((op.updatedAt || '') >= arr[idx].updatedAt) {
        const next = arr.slice()
        next[idx] = op.payload
        ev.data = { ...ev.data, [op.coll]: next }
      }
      ev.updatedAt = maxIso(ev.updatedAt, op.updatedAt)
    }
  }
  return [...map.values()]
}

function eventToOps(ev) {
  const ops = [
    { kind: 'upsert', coll: 'event', eventId: ev.id, updatedAt: ev.updatedAt, payload: { id: ev.id, createdAt: ev.createdAt, updatedAt: ev.updatedAt } },
    { kind: 'upsert', coll: 'festival', eventId: ev.id, updatedAt: ev.updatedAt, payload: ev.data.festival },
  ]
  for (const coll of ENTITY_COLLS) {
    for (const e of ev.data[coll] || []) {
      ops.push({ kind: 'upsert', coll, eventId: ev.id, id: e.id, updatedAt: e.updatedAt, payload: e })
    }
  }
  return ops
}

export function rootToOps(root) {
  return (root.events || []).flatMap(eventToOps)
}
