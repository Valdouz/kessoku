import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronsUpDown, Plus, Settings2 } from 'lucide-react'
import { useEvents, useCurrentEventId, useStore } from '@/lib/store'
import { EVENT_KINDS } from '@/lib/labels'
import { formatDateShortFR } from '@/lib/time'
import { EventForm } from '@/features/evenements/EventForm'
import { cn } from './ui/cn'

/** Sélecteur d'événement courant + accès création / gestion. */
export function EventSwitcher() {
  const events = useEvents()
  const currentId = useCurrentEventId()
  const switchEvent = useStore((s) => s.switchEvent)
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const current = events.find((e) => e.id === currentId) ?? events[0]
  if (!current) return null
  const curKind = EVENT_KINDS[current.data.festival.kind]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-night-700 bg-night-850 px-3 py-2 text-left transition hover:border-kessoku-500/50"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">
            {current.data.festival.name || 'Sans nom'}
          </span>
          <span className="block text-[11px] text-slate-500">
            {curKind.label}
            {current.data.festival.date ? ` · ${formatDateShortFR(current.data.festival.date)}` : ''}
          </span>
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[60vh] overflow-y-auto rounded-xl border border-night-700 bg-night-850 p-1 shadow-xl"
          >
            {events.map((e) => {
              const kind = EVENT_KINDS[e.data.festival.kind]
              const active = e.id === currentId
              return (
                <button
                  key={e.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    switchEvent(e.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition',
                    active ? 'bg-kessoku-600/15 text-white' : 'text-slate-300 hover:bg-night-800',
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: kind.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{e.data.festival.name || 'Sans nom'}</span>
                    <span className="block text-[11px] text-slate-500">
                      {kind.label}
                      {e.data.festival.date ? ` · ${formatDateShortFR(e.data.festival.date)}` : ''}
                    </span>
                  </span>
                  {active && <Check size={15} className="shrink-0 text-kessoku-300" />}
                </button>
              )
            })}

            <div className="my-1 border-t border-night-700" />
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setFormOpen(true)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-kessoku-300 hover:bg-night-800"
            >
              <Plus size={15} />
              Nouvel événement
            </button>
            <Link
              to="/reglages"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-400 hover:bg-night-800"
            >
              <Settings2 size={15} />
              Gérer les événements
            </Link>
          </div>
        </>
      )}

      <EventForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
