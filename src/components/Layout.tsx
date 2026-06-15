import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useFestival } from '@/lib/store'
import { BRAND } from '@/brand'
import { NAV } from '@/nav'
import { daysUntil } from '@/lib/time'
import { EventSwitcher } from './EventSwitcher'
import { CollabIndicator } from './CollabIndicator'
import { cn } from './ui/cn'

function Countdown() {
  const festival = useFestival()
  const d = daysUntil(festival.date)
  if (Number.isNaN(d)) return null
  const label = d > 0 ? `J−${d}` : d === 0 ? "Jour J 🎉" : `J+${Math.abs(d)}`
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-semibold',
        d <= 0 ? 'bg-kessoku-600 text-white' : d <= 7 ? 'bg-amber-500/20 text-amber-300' : 'bg-night-700 text-slate-300',
      )}
      title={`${festival.name} ${festival.edition}`}
    >
      {label}
    </span>
  )
}

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-kessoku-400 to-stellar-600 shadow-glow">
        <span className="whitespace-nowrap text-[13px] font-bold leading-none tracking-tight text-white">
          {BRAND.kanji}
        </span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-lg font-bold text-white">{BRAND.name}</div>
          <div className="text-[11px] text-slate-500">{BRAND.tagline}</div>
        </div>
      )}
    </div>
  )
}

const linkBase =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition'

export function Layout() {
  const mainRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => setMenuOpen(false), [location.pathname])

  // ESC ferme le menu mobile.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="min-h-screen">
      {/* Lien d'évitement (skip link) — onClick plutôt que href à cause du HashRouter */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          mainRef.current?.focus()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-kessoku-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Aller au contenu
      </a>

      {/* Décor stellaire discret */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-night-900"
        style={{
          backgroundImage:
            'radial-gradient(1200px 600px at 80% -10%, rgba(124,58,237,0.12), transparent), radial-gradient(900px 500px at 0% 110%, rgba(255,46,133,0.10), transparent)',
        }}
      />

      {/* Sidebar desktop */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-night-800 bg-night-900/80 px-4 py-5 backdrop-blur lg:flex">
        <div className="flex items-center justify-between">
          <Logo />
          <Countdown />
        </div>
        <div className="mt-5">
          <EventSwitcher />
        </div>
        <nav className="mt-5 flex flex-1 flex-col gap-1">
          {NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  linkBase,
                  isActive
                    ? 'bg-kessoku-600/15 text-white ring-1 ring-kessoku-500/30'
                    : 'text-slate-400 hover:bg-night-800 hover:text-slate-200',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-night-800 pt-4">
          <span className="text-[11px] text-slate-600">{BRAND.name} · local-first</span>
          <CollabIndicator />
        </div>
      </aside>

      {/* Top bar mobile */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-night-800 bg-night-900/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo compact />
        <div className="flex items-center gap-2">
          <CollabIndicator compact />
          <Countdown />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-night-800"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Tiroir de navigation mobile (toutes les rubriques) */}
      {menuOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] animate-fade-in flex-col gap-1 border-l border-night-800 bg-night-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-night-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-3">
              <EventSwitcher />
            </div>
            {NAV.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  cn(
                    linkBase,
                    isActive
                      ? 'bg-kessoku-600/15 text-white ring-1 ring-kessoku-500/30'
                      : 'text-slate-400 hover:bg-night-800 hover:text-slate-200',
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Contenu */}
      <main
        ref={mainRef}
        id="main"
        tabIndex={-1}
        className="px-4 pb-28 pt-5 outline-none sm:px-6 lg:ml-64 lg:px-10 lg:pb-12"
      >
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-night-800 bg-night-900/95 backdrop-blur lg:hidden">
        {NAV.filter((n) => n.primary).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition',
                isActive ? 'text-kessoku-300' : 'text-slate-400',
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
