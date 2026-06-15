// Helpers de formatage propres au module Matériel.

// Le formatage monétaire est centralisé dans lib/money ; on le ré-exporte ici
// pour ne pas casser les imports existants du module.
export { formatEUR } from '@/lib/money'

/** Total d'une ligne d'inventaire (qty × prix unitaire). */
export function lineTotal(qty: number, unitPrice?: number): number {
  if (unitPrice == null || !Number.isFinite(unitPrice) || unitPrice < 0) return 0
  return qty * unitPrice
}
