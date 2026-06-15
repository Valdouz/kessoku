// Formatage monétaire centralisé (source unique pour toute l'app).

const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Formate un montant en euros (fr-FR). */
export function formatEUR(value: number): string {
  return EUR.format(value)
}
