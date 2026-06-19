// Données de DÉMONSTRATION (génériques, open source).
// Au premier lancement, l'app charge ces exemples ; ensuite tout est éditable et
// persisté en local. Remplacez-les par vos propres événements dans l'app.

import type {
  AppData,
  Artist,
  FestivalEvent,
  MaterialItem,
  Member,
  RootData,
  Slot,
  Task,
  Volunteer,
} from '@/lib/types'
import { seedMaterials } from './seedMaterials'

const TS = '2026-01-01T08:00:00.000Z'
const ts = () => ({ createdAt: TS, updatedAt: TS })

// ── Équipe (exemple) ─────────────────────────────────────────────────────────
const members: Member[] = [
  { id: 'mem-coord', name: 'Coordination', roles: ['coordination'], org: 'Association', phone: '', email: '', isPartner: false, notes: 'Référent·e du projet.', ...ts() },
  { id: 'mem-son', name: 'Régie son', roles: ['son'], org: 'Régie', phone: '', email: '', isPartner: false, notes: 'Responsable son en direct.', ...ts() },
  { id: 'mem-com', name: 'Communication', roles: ['communication'], org: 'Association', phone: '', email: '', isPartner: false, notes: '', ...ts() },
  { id: 'mem-log', name: 'Logistique', roles: ['logistique'], org: 'Association', phone: '', email: '', isPartner: false, notes: '', ...ts() },
  { id: 'mem-partner', name: 'Association partenaire', roles: ['partenaire'], org: 'Partenaire', phone: '', email: '', isPartner: true, notes: 'Appui artistique & technique.', ...ts() },
  { id: 'mem-mairie', name: 'Contact mairie', roles: ['contact_externe'], org: 'Mairie', phone: '', email: '', isPartner: false, notes: 'Coordination municipale.', ...ts() },
]

// ── Artistes (exemple) ───────────────────────────────────────────────────────
const artists: Artist[] = [
  { id: 'art-groupe', name: 'Groupe rock', kind: 'groupe', status: 'confirme', members: 'Chant, guitare, basse, batterie', contactName: '', contactPhone: '', contactEmail: '', social: '', setDurationMin: 40, soundcheckTime: '', techNeeds: 'Patch complet à recueillir.', backline: 'Backline régie possible.', notes: '', ...ts() },
  { id: 'art-duo', name: 'Duo voix & piano', kind: 'duo', status: 'pressenti', members: 'Voix + piano', contactName: '', contactPhone: '', contactEmail: '', social: '', setDurationMin: 30, soundcheckTime: '', techNeeds: '1 micro chant + repiquage piano.', backline: '', notes: '', ...ts() },
  { id: 'art-danse', name: 'Compagnie de danse', kind: 'danse', status: 'pressenti', members: '', contactName: '', contactPhone: '', contactEmail: '', social: '', setDurationMin: 20, soundcheckTime: '', techNeeds: 'Diffusion playback.', backline: '', notes: '', ...ts() },
  { id: 'art-dj', name: 'DJ set', kind: 'dj', status: 'confirme', members: '', contactName: '', contactPhone: '', contactEmail: '', social: '', setDurationMin: 60, soundcheckTime: '', techNeeds: 'Table DJ / contrôleur.', backline: '', notes: 'Clôture.', ...ts() },
]

// ── Conducteur (exemple) ─────────────────────────────────────────────────────
type SlotDraft = Omit<Slot, 'id' | 'order' | 'createdAt' | 'updatedAt'>
const slotDrafts: SlotDraft[] = [
  { title: 'Accueil & ouverture', type: 'discours', startTime: '14:00', durationMin: 10, stage: 'Scène principale', notes: '' },
  { title: 'Groupe rock', type: 'scene', startTime: '14:10', durationMin: 40, artistId: 'art-groupe', stage: 'Scène principale', notes: '' },
  { title: 'Changement de plateau', type: 'technique', startTime: '14:50', durationMin: 15, stage: 'Scène principale', notes: '' },
  { title: 'Duo voix & piano', type: 'scene', startTime: '15:05', durationMin: 30, artistId: 'art-duo', stage: 'Scène principale', notes: '' },
  { title: 'Compagnie de danse', type: 'danse', startTime: '15:35', durationMin: 20, artistId: 'art-danse', stage: 'Scène principale', notes: '' },
  { title: 'Changement de plateau', type: 'technique', startTime: '15:55', durationMin: 15, stage: 'Scène principale', notes: '' },
  { title: 'DJ set', type: 'dj', startTime: '16:10', durationMin: 60, artistId: 'art-dj', stage: 'Scène principale', notes: '' },
]
const slots: Slot[] = slotDrafts.map((s, i) => ({ ...s, id: `slot-${String(i + 1).padStart(2, '0')}`, order: i, ...ts() }))

// ── Checklist (exemple) ──────────────────────────────────────────────────────
type TaskDraft = Omit<Task, 'id' | 'order' | 'createdAt' | 'updatedAt' | 'done'> & { done?: boolean }
const taskDrafts: TaskDraft[] = [
  { title: 'Confirmer la programmation', phase: 'avant', priority: 'haute', assignee: 'Coordination', dueDate: '', notes: '' },
  { title: 'Récupérer les fiches techniques des artistes', phase: 'avant', priority: 'normale', assignee: 'Régie son', dueDate: '', notes: '' },
  { title: "Plan d'implantation (scène, régie, circulation)", phase: 'avant', priority: 'normale', assignee: '', dueDate: '', notes: '' },
  { title: 'Montage scène + sonorisation', phase: 'montage', priority: 'haute', assignee: '', dueDate: '', notes: '' },
  { title: 'Balances / soundchecks', phase: 'montage', priority: 'haute', assignee: 'Régie son', dueDate: '', notes: '' },
  { title: 'Gestion du son en direct', phase: 'pendant', priority: 'critique', assignee: 'Régie son', dueDate: '', notes: '' },
  { title: 'Accueil & accompagnement des artistes', phase: 'pendant', priority: 'normale', assignee: '', dueDate: '', notes: '' },
  { title: 'Démontage + rangement', phase: 'demontage', priority: 'normale', assignee: '', dueDate: '', notes: '' },
  { title: "Bilan avec l'équipe", phase: 'apres', priority: 'basse', assignee: '', dueDate: '', notes: '' },
]
const tasks: Task[] = taskDrafts.map((t, i) => ({ done: false, ...t, id: `task-${String(i + 1).padStart(2, '0')}`, order: i, ...ts() }))

// ── Bénévoles (exemple) ──────────────────────────────────────────────────────
const volunteers: Volunteer[] = [
  { id: 'vol-1', name: 'Bénévole accueil', poste: 'Accueil / billetterie', availability: '13:00 – 18:00', status: 'confirme', phone: '', email: '', referent: 'Coordination', mealIncluded: true, notes: '', ...ts() },
  { id: 'vol-2', name: 'Bénévole bar', poste: 'Bar / buvette', availability: '14:00 – 18:00', status: 'pressenti', phone: '', email: '', referent: 'Logistique', mealIncluded: true, notes: '', ...ts() },
  { id: 'vol-3', name: 'Bénévole montage', poste: 'Montage / démontage', availability: '09:30 – 12:00 · 18:00 – 20:00', status: 'confirme', phone: '', email: '', referent: 'Régie son', mealIncluded: false, notes: '', ...ts() },
]

// ── Événement 1 : Festival (démo) ────────────────────────────────────────────
const festivalData: AppData = {
  festival: {
    kind: 'festival',
    name: 'Festival Démo',
    edition: '2026',
    date: '2026-07-04',
    startTime: '14:00',
    endTime: '18:00',
    crewAccessTime: '09:30',
    loadInDeadline: '13:30',
    venue: 'Parc municipal',
    city: 'Ma Ville',
    context: 'Programmation estivale',
    description: 'Festival de démonstration : scène ouverte, danse et DJ set de clôture.',
    notes: 'Données d’exemple — remplacez-les par les vôtres (ou importez un export).',
  },
  slots,
  artists,
  materials: seedMaterials,
  tasks,
  members,
  volunteers,
}

// ── Événement 2 : Concert (démo, réutilise un peu de matériel) ───────────────
const concertMaterials: MaterialItem[] = seedMaterials
  .slice(0, 8)
  .map((m) => ({ ...m, id: `c2-${m.id}`, ...ts() }))

const concertData: AppData = {
  festival: {
    kind: 'concert',
    name: 'Concert Démo',
    edition: '2026',
    date: '2026-06-21',
    startTime: '20:30',
    endTime: '23:00',
    crewAccessTime: '17:00',
    loadInDeadline: '19:30',
    venue: 'Salle de concert',
    city: 'Ma Ville',
    context: '',
    description: 'Concert de démonstration.',
    notes: '',
  },
  slots: [
    { id: 'c2-slot-01', title: 'Balances / soundcheck', type: 'technique', startTime: '18:00', durationMin: 90, stage: 'Scène', notes: '', order: 0, ...ts() },
    { id: 'c2-slot-02', title: 'Concert', type: 'scene', startTime: '20:30', durationMin: 90, stage: 'Scène', notes: '', order: 1, ...ts() },
  ],
  artists: [
    { id: 'c2-art-groupe', name: 'Groupe', kind: 'groupe', status: 'confirme', members: '', contactName: '', contactPhone: '', contactEmail: '', social: '', setDurationMin: 90, soundcheckTime: '18:00', techNeeds: 'Backline complet (cf. inventaire).', backline: '', notes: '', ...ts() },
  ],
  materials: concertMaterials,
  tasks: [
    { id: 'c2-task-01', title: 'Transport du matériel', phase: 'avant', priority: 'haute', done: false, assignee: '', dueDate: '', notes: '', order: 0, ...ts() },
    { id: 'c2-task-02', title: 'Installation + balances', phase: 'montage', priority: 'haute', done: false, assignee: 'Régie son', dueDate: '', notes: '', order: 1, ...ts() },
    { id: 'c2-task-03', title: 'Démontage + inventaire retour', phase: 'demontage', priority: 'normale', done: false, assignee: '', dueDate: '', notes: '', order: 2, ...ts() },
  ],
  members: [
    { id: 'c2-mem-son', name: 'Régie son', roles: ['son'], org: 'Régie', phone: '', email: '', isPartner: false, notes: '', ...ts() },
  ],
  volunteers: [],
}

// ── Racine multi-événements ──────────────────────────────────────────────────
const festivalEvent: FestivalEvent = { id: 'evt-festival', data: festivalData, ...ts() }
const concertEvent: FestivalEvent = { id: 'evt-concert', data: concertData, ...ts() }

export const seedRoot: RootData = {
  events: [festivalEvent, concertEvent],
  currentEventId: festivalEvent.id,
}
