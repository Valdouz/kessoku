// Fabriques d'entités — utilisées par le store (ajout) ET par les formulaires
// (création d'une fiche vierge). Chaque make* renvoie une entité complète.

import { newId, nowISO } from '@/lib/ids'
import type {
  AppData,
  Artist,
  Festival,
  FestivalEvent,
  MaterialItem,
  Member,
  Slot,
  Task,
  Volunteer,
} from '@/lib/types'

function base() {
  const ts = nowISO()
  return { id: newId(), createdAt: ts, updatedAt: ts }
}

export function makeSlot(p: Partial<Slot> = {}): Slot {
  return {
    ...base(),
    title: '',
    type: 'scene',
    startTime: '14:00',
    durationMin: 20,
    stage: 'Scène principale',
    notes: '',
    order: 0,
    ...p,
  }
}

export function makeArtist(p: Partial<Artist> = {}): Artist {
  return {
    ...base(),
    name: '',
    kind: 'groupe',
    status: 'pressenti',
    members: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    social: '',
    soundcheckTime: '',
    arrivalTime: '',
    techNeeds: '',
    backline: '',
    bringing: '',
    setlist: '',
    catering: '',
    notes: '',
    ...p,
  }
}

export function makeMaterial(p: Partial<MaterialItem> = {}): MaterialItem {
  return {
    ...base(),
    name: '',
    category: 'Divers',
    qty: 1,
    owner: '',
    status: 'a_apporter',
    assignedTo: '',
    location: '',
    notes: '',
    ...p,
  }
}

export function makeTask(p: Partial<Task> = {}): Task {
  return {
    ...base(),
    title: '',
    phase: 'avant',
    priority: 'normale',
    done: false,
    assignee: '',
    dueDate: '',
    notes: '',
    order: 0,
    ...p,
  }
}

export function makeMember(p: Partial<Member> = {}): Member {
  return {
    ...base(),
    name: '',
    roles: [],
    org: '',
    phone: '',
    email: '',
    isPartner: false,
    notes: '',
    ...p,
  }
}

export function makeVolunteer(p: Partial<Volunteer> = {}): Volunteer {
  return {
    ...base(),
    name: '',
    poste: '',
    availability: '',
    status: 'pressenti',
    phone: '',
    email: '',
    referent: '',
    mealIncluded: false,
    notes: '',
    ...p,
  }
}

export const emptyFestival: Festival = {
  kind: 'concert',
  name: '',
  edition: '',
  date: '',
  startTime: '18:00',
  endTime: '23:00',
  crewAccessTime: '14:00',
  loadInDeadline: '17:00',
  venue: '',
  city: '',
  context: '',
  description: '',
  notes: '',
}

/** Crée un événement vierge (festival/concert) avec ses données vides. */
export function makeEvent(festivalPatch: Partial<Festival> = {}, data: Partial<AppData> = {}): FestivalEvent {
  return {
    ...base(),
    data: {
      festival: { ...emptyFestival, ...festivalPatch },
      slots: [],
      artists: [],
      materials: [],
      tasks: [],
      members: [],
      volunteers: [],
      ...data,
    },
  }
}
