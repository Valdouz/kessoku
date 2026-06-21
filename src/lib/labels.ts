// Libellés FR + couleurs pour tous les enums du modèle.
// Centralisé pour une UI cohérente (badges, filtres, formulaires).

import type {
  ArtistKind,
  ArtistStatus,
  EventKind,
  MaterialStatus,
  Member,
  MemberRole,
  SlotType,
  TaskPhase,
  TaskPriority,
  VolunteerStatus,
} from './types'

export interface LabelDef {
  label: string
  /** Classes Tailwind pour un badge (texte + fond). */
  badge: string
  /** Couleur d'accent (hex) — utile pour barres/points. */
  color: string
}

export const EVENT_KINDS: Record<EventKind, LabelDef> = {
  festival: { label: 'Festival', badge: 'bg-kessoku-500/15 text-kessoku-200', color: '#ff2e85' },
  concert: { label: 'Concert', badge: 'bg-stellar-500/15 text-stellar-400', color: '#8b5cf6' },
  autre: { label: 'Autre', badge: 'bg-night-600 text-slate-300', color: '#94a3b8' },
}

export const SLOT_TYPES: Record<SlotType, LabelDef> = {
  scene: { label: 'Scène', badge: 'bg-kessoku-500/15 text-kessoku-200', color: '#ff2e85' },
  danse: { label: 'Danse', badge: 'bg-stellar-500/15 text-stellar-400', color: '#8b5cf6' },
  dj: { label: 'DJ set', badge: 'bg-cyan-500/15 text-cyan-300', color: '#22d3ee' },
  pause: { label: 'Pause', badge: 'bg-night-600 text-slate-300', color: '#64748b' },
  technique: { label: 'Technique', badge: 'bg-amber-500/15 text-amber-300', color: '#f59e0b' },
  discours: { label: 'Discours', badge: 'bg-emerald-500/15 text-emerald-300', color: '#10b981' },
  autre: { label: 'Autre', badge: 'bg-night-600 text-slate-300', color: '#94a3b8' },
}

export const ARTIST_KINDS: Record<ArtistKind, LabelDef> = {
  groupe: { label: 'Groupe', badge: 'bg-kessoku-500/15 text-kessoku-200', color: '#ff2e85' },
  solo: { label: 'Solo', badge: 'bg-stellar-500/15 text-stellar-400', color: '#8b5cf6' },
  duo: { label: 'Duo', badge: 'bg-indigo-500/15 text-indigo-300', color: '#818cf8' },
  chant: { label: 'Chant', badge: 'bg-rose-500/15 text-rose-300', color: '#fb7185' },
  danse: { label: 'Danse', badge: 'bg-violet-500/15 text-violet-300', color: '#a78bfa' },
  dj: { label: 'DJ', badge: 'bg-cyan-500/15 text-cyan-300', color: '#22d3ee' },
  autre: { label: 'Autre', badge: 'bg-night-600 text-slate-300', color: '#94a3b8' },
}

export const ARTIST_STATUS: Record<ArtistStatus, LabelDef> = {
  pressenti: { label: 'Pressenti', badge: 'bg-slate-500/15 text-slate-300', color: '#94a3b8' },
  contacte: { label: 'Contacté', badge: 'bg-amber-500/15 text-amber-300', color: '#f59e0b' },
  confirme: { label: 'Confirmé', badge: 'bg-emerald-500/15 text-emerald-300', color: '#10b981' },
  desiste: { label: 'Désisté', badge: 'bg-red-500/15 text-red-300', color: '#ef4444' },
}

export const MATERIAL_STATUS: Record<MaterialStatus, LabelDef> = {
  a_apporter: { label: 'À apporter', badge: 'bg-amber-500/15 text-amber-300', color: '#f59e0b' },
  ne_pas_apporter: { label: 'Ne pas apporter', badge: 'bg-night-600 text-slate-400', color: '#64748b' },
  sur_place: { label: 'Sur place', badge: 'bg-emerald-500/15 text-emerald-300', color: '#10b981' },
  manquant: { label: 'Manquant', badge: 'bg-red-500/15 text-red-300', color: '#ef4444' },
  loue: { label: 'Loué', badge: 'bg-stellar-500/15 text-stellar-400', color: '#8b5cf6' },
  reserve: { label: 'Réservé', badge: 'bg-cyan-500/15 text-cyan-300', color: '#22d3ee' },
}

export const TASK_PHASES: Record<TaskPhase, LabelDef> = {
  avant: { label: 'Avant', badge: 'bg-stellar-500/15 text-stellar-400', color: '#8b5cf6' },
  montage: { label: 'Montage', badge: 'bg-amber-500/15 text-amber-300', color: '#f59e0b' },
  pendant: { label: 'Pendant', badge: 'bg-kessoku-500/15 text-kessoku-200', color: '#ff2e85' },
  demontage: { label: 'Démontage', badge: 'bg-cyan-500/15 text-cyan-300', color: '#22d3ee' },
  apres: { label: 'Après', badge: 'bg-emerald-500/15 text-emerald-300', color: '#10b981' },
}

export const TASK_PRIORITIES: Record<TaskPriority, LabelDef> = {
  basse: { label: 'Basse', badge: 'bg-slate-500/15 text-slate-400', color: '#94a3b8' },
  normale: { label: 'Normale', badge: 'bg-stellar-500/15 text-stellar-400', color: '#8b5cf6' },
  haute: { label: 'Haute', badge: 'bg-amber-500/15 text-amber-300', color: '#f59e0b' },
  critique: { label: 'Critique', badge: 'bg-red-500/15 text-red-300', color: '#ef4444' },
}

export const MEMBER_ROLES: Record<MemberRole, LabelDef> = {
  coordination: { label: 'Coordination', badge: 'bg-kessoku-500/15 text-kessoku-200', color: '#ff2e85' },
  artistes: { label: 'Artistes', badge: 'bg-rose-500/15 text-rose-300', color: '#fb7185' },
  communication: { label: 'Communication', badge: 'bg-stellar-500/15 text-stellar-400', color: '#8b5cf6' },
  logistique: { label: 'Logistique', badge: 'bg-amber-500/15 text-amber-300', color: '#f59e0b' },
  son: { label: 'Son / régie', badge: 'bg-cyan-500/15 text-cyan-300', color: '#22d3ee' },
  securite: { label: 'Sécurité', badge: 'bg-orange-500/15 text-orange-300', color: '#fb923c' },
  partenaire: { label: 'Partenaire', badge: 'bg-indigo-500/15 text-indigo-300', color: '#818cf8' },
  contact_externe: { label: 'Contact externe', badge: 'bg-slate-500/15 text-slate-300', color: '#94a3b8' },
  autre: { label: 'Autre', badge: 'bg-night-600 text-slate-300', color: '#94a3b8' },
}

export const VOLUNTEER_STATUS: Record<VolunteerStatus, LabelDef> = {
  pressenti: { label: 'Pressenti', badge: 'bg-slate-500/15 text-slate-300', color: '#94a3b8' },
  confirme: { label: 'Confirmé', badge: 'bg-emerald-500/15 text-emerald-300', color: '#10b981' },
  indisponible: { label: 'Indisponible', badge: 'bg-red-500/15 text-red-300', color: '#ef4444' },
}

/** Transforme un Record de LabelDef en options {value,label} pour les <select>. */
export function toOptions<T extends string>(rec: Record<T, LabelDef>): { value: T; label: string }[] {
  return (Object.keys(rec) as T[]).map((value) => ({ value, label: rec[value].label }))
}

/** Rôles d'un membre (rétrocompat `role`->tableau ; filtre les rôles inconnus, ex. ancien « benevole »). */
export function memberRoles(m: Member): MemberRole[] {
  const raw = Array.isArray(m.roles) && m.roles.length ? m.roles : m.role ? [m.role] : []
  return raw.filter((r): r is MemberRole => r in MEMBER_ROLES)
}
