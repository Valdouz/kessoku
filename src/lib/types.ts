// ──────────────────────────────────────────────────────────────────────────
// Modèle de données Kessoku — contrat partagé par tous les modules.
// Local-first : tout est sérialisable en JSON (export/import + sync futur).
// ──────────────────────────────────────────────────────────────────────────

export type ID = string

/** Champs communs à toutes les entités (utiles pour le tri et la future sync). */
export interface Timestamped {
  id: ID
  createdAt: string // ISO
  updatedAt: string // ISO
}

// ── Festival / événement ─────────────────────────────────────────────────────
export type EventKind = 'festival' | 'concert' | 'autre'

export interface Festival {
  /** Type d'événement (festival, concert…). */
  kind: EventKind
  name: string
  edition: string
  date: string // ISO date "2026-07-04"
  startTime: string // "14:00"
  endTime: string // "18:00"
  crewAccessTime: string // "09:30" — accès équipe/artistes
  loadInDeadline: string // "13:30" — dépose matériel avant
  venue: string
  city: string
  context: string // cadre / événement parent
  description: string
  notes: string
}

// ── Conducteur (déroulé du jour) ─────────────────────────────────────────────
export type SlotType =
  | 'scene' // scène ouverte / concert
  | 'danse'
  | 'dj'
  | 'pause'
  | 'technique' // balance, changement de plateau
  | 'discours' // accueil, remerciements
  | 'autre'

export interface Slot extends Timestamped {
  title: string
  type: SlotType
  startTime: string // "14:00"
  durationMin: number
  artistId?: ID // lien vers une fiche artiste
  stage: string // nom de scène / zone
  notes: string
  order: number
}

// ── Artistes ─────────────────────────────────────────────────────────────────
export type ArtistKind =
  | 'groupe'
  | 'solo'
  | 'duo'
  | 'chant'
  | 'danse'
  | 'dj'
  | 'autre'

export type ArtistStatus = 'pressenti' | 'contacte' | 'confirme' | 'desiste'

export interface Artist extends Timestamped {
  name: string
  kind: ArtistKind
  status: ArtistStatus
  members: string // line-up / composition
  contactName: string
  contactPhone: string
  contactEmail: string
  social: string
  setDurationMin?: number
  soundcheckTime: string // "11:30"
  techNeeds: string // besoins techniques / patch / input list
  backline: string // matériel apporté / demandé
  notes: string
}

// ── Inventaire matériel ──────────────────────────────────────────────────────
export type MaterialStatus =
  | 'a_apporter'
  | 'ne_pas_apporter'
  | 'sur_place'
  | 'manquant'
  | 'loue'
  | 'reserve'

export interface MaterialItem extends Timestamped {
  name: string
  category: string
  qty: number
  unitPrice?: number // € (HT/TTC indifférent ici, indicatif)
  owner: string // provenance / qui apporte
  status: MaterialStatus
  assignedTo: string // responsable transport/installation
  location: string // emplacement (caisse, zone, scène…)
  notes: string
}

// ── Checklist / tâches régie ─────────────────────────────────────────────────
export type TaskPhase = 'avant' | 'montage' | 'pendant' | 'demontage' | 'apres'
export type TaskPriority = 'basse' | 'normale' | 'haute' | 'critique'

export interface Task extends Timestamped {
  title: string
  phase: TaskPhase
  priority: TaskPriority
  done: boolean
  assignee: string // membre de l'équipe (nom)
  dueDate: string // ISO date (optionnel, "")
  notes: string
  order: number
}

// ── Équipe & contacts ────────────────────────────────────────────────────────
export type MemberRole =
  | 'coordination'
  | 'artistes'
  | 'communication'
  | 'logistique'
  | 'son'
  | 'securite'
  | 'benevole'
  | 'partenaire'
  | 'contact_externe'
  | 'autre'

export interface Member extends Timestamped {
  name: string
  role: MemberRole
  org: string // association, partenaire, mairie…
  phone: string
  email: string
  isPartner: boolean
  notes: string
}

// ── Données d'UN événement ───────────────────────────────────────────────────
export interface AppData {
  festival: Festival
  slots: Slot[]
  artists: Artist[]
  materials: MaterialItem[]
  tasks: Task[]
  members: Member[]
}

// ── Multi-événements ─────────────────────────────────────────────────────────
/** Un événement = un concert/festival avec toutes ses données. */
export interface FestivalEvent extends Timestamped {
  data: AppData
}

/** Racine persistée : la liste des événements + celui actif. */
export interface RootData {
  events: FestivalEvent[]
  currentEventId: ID
}

/** Schéma de fichier d'export/import (avec entête de version). */
export interface ExportFile {
  app: 'kessoku'
  schemaVersion: number
  exportedAt: string
  /** Données d'un seul événement (l'événement courant). */
  data: AppData
}

// ── Collections éditables (clés des tableaux dans AppData) ────────────────────
export type CollectionKey = 'slots' | 'artists' | 'materials' | 'tasks' | 'members'
