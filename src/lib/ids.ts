/** Génère un identifiant unique (UUID v4 si dispo, sinon repli). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Repli simple (navigateurs anciens)
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Horodatage ISO du moment présent. */
export function nowISO(): string {
  return new Date().toISOString()
}
