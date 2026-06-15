import { Link } from 'react-router-dom'
import { useCollab } from '@/lib/collab'
import { cn } from './ui/cn'

const DOT: Record<string, string> = {
  off: 'bg-slate-500',
  connecting: 'bg-amber-400 animate-pulse',
  online: 'bg-emerald-400',
  error: 'bg-red-400',
}

/** Pastille de présence collaborative (lien vers les réglages). */
export function CollabIndicator({ compact }: { compact?: boolean }) {
  const status = useCollab((s) => s.status)
  const count = useCollab((s) => s.users.length)

  const label =
    status === 'online'
      ? `${count} en ligne`
      : status === 'connecting'
        ? 'Connexion…'
        : status === 'error'
          ? 'Hors ligne'
          : 'Collaboration'

  return (
    <Link
      to="/reglages"
      title="Collaboration"
      className={cn(
        'flex items-center gap-1.5 rounded-full border border-night-700 px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:border-kessoku-500/40 hover:text-slate-200',
        compact && 'px-2',
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', DOT[status])} aria-hidden />
      {!compact && label}
      {compact && status === 'online' && count > 0 && <span>{count}</span>}
    </Link>
  )
}
