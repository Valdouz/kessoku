import { formatDateFR } from '@/lib/time'
import type { Festival } from '@/lib/types'

/** Classes de cellules de tableau (lisibles à l'écran sombre et à l'impression claire). */
export const th =
  'border border-night-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400'
export const td = 'border border-night-700 px-3 py-2 align-top text-slate-300'

/** En-tête de document : titre + identité de l'événement (nom, date, lieu). */
export function DocHeader({ title, festival }: { title: string; festival: Festival }) {
  const sub = [
    `${festival.name}${festival.edition ? ` ${festival.edition}` : ''}`,
    festival.date ? formatDateFR(festival.date) : '',
    [festival.venue, festival.city].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="border-b border-night-700 pb-3">
      <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
      {sub && <p className="mt-0.5 text-sm text-slate-400">{sub}</p>}
    </div>
  )
}
