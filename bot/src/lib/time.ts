// Conversion heure « murale » Europe/Paris -> instant epoch, sans dépendance.
// Les heures du conducteur ("14:00") sont en heure locale du festival (France).

const TZ = 'Europe/Paris'

/** Décalage (ms) d'Europe/Paris par rapport à UTC à un instant donné. */
function parisOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value
  const asUTC = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour), Number(p.minute), Number(p.second),
  )
  return asUTC - date.getTime()
}

/** Epoch (ms) correspondant à une heure murale Paris (date "YYYY-MM-DD", heure "HH:MM"). */
export function parisEpoch(dateStr: string, timeStr: string): number {
  const [Y, Mo, D] = dateStr.slice(0, 10).split('-').map(Number)
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  const guess = Date.UTC(Y, Mo - 1, D, h || 0, m || 0)
  // Une correction suffit (le décalage est stable autour de l'instant visé).
  return guess - parisOffsetMs(new Date(guess))
}

/** Date du jour à Paris, "YYYY-MM-DD". */
export function parisToday(): string {
  const p: Record<string, string> = {}
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  })
  for (const part of dtf.formatToParts(new Date())) p[part.type] = part.value
  return `${p.year}-${p.month}-${p.day}`
}

/** "HH:MM" à Paris pour un epoch donné. */
export function parisHM(epochMs: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(epochMs))
}
