// Inventaire de DÉMONSTRATION (données génériques, open source).
// Remplacez-le par votre vrai matériel dans l'app (il reste en local / sur votre
// serveur, pas dans ce dépôt public).
import type { MaterialItem } from '@/lib/types'

const TS = '2026-01-01T08:00:00.000Z'

interface Demo {
  name: string
  category: string
  qty: number
  unitPrice: number
}

const demo: Demo[] = [
  { name: 'Guitare électrique', category: 'Guitares', qty: 2, unitPrice: 600 },
  { name: 'Guitare acoustique électro', category: 'Guitares', qty: 1, unitPrice: 350 },
  { name: 'Basse électrique', category: 'Basses', qty: 1, unitPrice: 500 },
  { name: 'Ampli guitare (combo)', category: 'Amplis', qty: 2, unitPrice: 450 },
  { name: 'Ampli basse (combo)', category: 'Amplis', qty: 1, unitPrice: 400 },
  { name: 'Batterie complète (5 fûts)', category: 'Batterie', qty: 1, unitPrice: 900 },
  { name: 'Set de cymbales', category: 'Cymbales', qty: 1, unitPrice: 500 },
  { name: 'Micro chant SM58', category: 'Micros', qty: 3, unitPrice: 110 },
  { name: 'Micro instrument SM57', category: 'Micros', qty: 2, unitPrice: 110 },
  { name: 'Table de mixage 16 pistes', category: 'Audio & informatique', qty: 1, unitPrice: 700 },
  { name: 'Enceintes façade (paire)', category: 'Audio & informatique', qty: 1, unitPrice: 1200 },
  { name: 'Retour de scène (wedge)', category: 'Audio & informatique', qty: 2, unitPrice: 300 },
  { name: 'Interface audio', category: 'Audio & informatique', qty: 1, unitPrice: 180 },
  { name: 'Multipaire 16 voies', category: 'Câbles', qty: 1, unitPrice: 250 },
  { name: 'Lot de câbles XLR', category: 'Câbles', qty: 1, unitPrice: 120 },
]

export const seedMaterials: MaterialItem[] = demo.map((m, i) => ({
  id: `mat-${String(i + 1).padStart(3, '0')}`,
  name: m.name,
  category: m.category,
  qty: m.qty,
  unitPrice: m.unitPrice,
  owner: 'Régie',
  status: 'a_apporter',
  assignedTo: '',
  location: '',
  notes: '',
  createdAt: TS,
  updatedAt: TS,
}))
