// Utilitaires de temps — on manipule les horaires comme "HH:MM" (chaîne)
// pour rester simple et 100% local (pas de fuseau horaire à gérer).

/** "HH:MM" -> minutes depuis minuit. Renvoie NaN si invalide. */
export function timeToMinutes(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  if (!m) return NaN
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return NaN
  return h * 60 + min
}

/** minutes depuis minuit -> "HH:MM". */
export function minutesToTime(total: number): string {
  const t = ((Math.round(total) % 1440) + 1440) % 1440
  const h = Math.floor(t / 60)
  const m = t % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Ajoute des minutes à un horaire "HH:MM". */
export function addMinutes(t: string, delta: number): string {
  const base = timeToMinutes(t)
  if (Number.isNaN(base)) return t
  return minutesToTime(base + delta)
}

/** Durée (min) entre deux horaires "HH:MM" (gère le passage de minuit). */
export function diffMinutes(start: string, end: string): number {
  const a = timeToMinutes(start)
  const b = timeToMinutes(end)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return b >= a ? b - a : b + 1440 - a
}

/** Formate une durée en "1h30", "45 min", etc. */
export function formatDuration(min: number): string {
  if (!min || min < 0) return '0 min'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

/** Jours entiers restants avant une date ISO (négatif si passé). */
export function daysUntil(isoDate: string, from: Date = new Date()): number {
  const target = new Date(isoDate + (isoDate.length <= 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(target.getTime())) return NaN
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** "2026-07-04" -> "samedi 4 juillet 2026". */
export function formatDateFR(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(isoDate + (isoDate.length <= 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return isoDate
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`
}

/** "2026-07-04" -> "4 juil." (court). */
export function formatDateShortFR(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(isoDate + (isoDate.length <= 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return isoDate
  const moisCourt = MOIS[d.getMonth()].slice(0, 4)
  return `${d.getDate()} ${moisCourt}.`
}
