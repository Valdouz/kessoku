import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Clock,
  Guitar,
  ListChecks,
  MapPin,
  Mic2,
  PackageX,
  Sparkles,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  useArtists,
  useFestival,
  useMaterials,
  useMembers,
  useSlots,
  useTasks,
} from '@/lib/store'
import { SLOT_TYPES, TASK_PRIORITIES } from '@/lib/labels'
import {
  addMinutes,
  daysUntil,
  formatDateFR,
  formatDateShortFR,
  formatDuration,
  timeToMinutes,
} from '@/lib/time'
import { Badge, Card, CardBody, CardHeader, PageHeader, cn } from '@/components/ui'
import { formatEUR } from '@/lib/money'
import { lineTotal } from '../inventaire/format'
import type { Task, TaskPriority } from '@/lib/types'

// ── Helpers locaux ───────────────────────────────────────────────────────────

/** Date du jour au format ISO court "YYYY-MM-DD" (sans fuseau). */
function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** Rang de priorité (plus grand = plus urgent) pour le tri. */
const PRIORITY_RANK: Record<TaskPriority, number> = {
  critique: 3,
  haute: 2,
  normale: 1,
  basse: 0,
}

/** Tri des tâches « à venir » : par date d'échéance (vides en dernier), puis priorité. */
function compareUpcoming(a: Task, b: Task): number {
  const da = a.dueDate || '￿'
  const db = b.dueDate || '￿'
  if (da !== db) return da < db ? -1 : 1
  return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
}

// ── Compte à rebours ──────────────────────────────────────────────────────────

function Countdown({ date }: { date: string }) {
  const n = date ? daysUntil(date) : NaN

  let big: string
  let label: string
  let tone: string

  if (Number.isNaN(n)) {
    big = '—'
    label = 'Date non définie'
    tone = 'text-slate-400'
  } else if (n === 0) {
    big = 'Jour J'
    label = "C'est aujourd'hui !"
    tone = 'text-kessoku-300'
  } else if (n > 0) {
    big = `J−${n}`
    label = n === 1 ? 'Plus qu’un jour' : `Plus que ${n} jours`
    tone = 'text-stellar-300'
  } else {
    big = `J+${-n}`
    label = "L'édition est passée"
    tone = 'text-slate-400'
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-night-700 bg-night-800/60 px-5 py-3 text-center">
      <span className="text-[11px] uppercase tracking-widest text-slate-500">Compte à rebours</span>
      <span className={cn('text-3xl font-extrabold leading-none sm:text-4xl', tone)}>{big}</span>
      <span className="mt-1 text-xs text-slate-400">{label}</span>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  to,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  to: string
  accent: string
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-night-700 bg-night-800/60 p-4 transition hover:border-night-600 hover:bg-night-800"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl', accent)}>
          <Icon size={18} aria-hidden />
        </span>
        <ArrowRight
          size={16}
          className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
          aria-hidden
        />
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-300">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </Link>
  )
}

// ── Ligne d'info clé ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-stellar-400" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm text-slate-200">{value || '—'}</p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const festival = useFestival()
  const slots = useSlots()
  const artists = useArtists()
  const materials = useMaterials()
  const tasks = useTasks()
  const members = useMembers()

  const today = todayISO()

  // ── Statistiques artistes ──────────────────────────────────────────────────
  const artistStats = useMemo(() => {
    const confirmed = artists.filter((a) => a.status === 'confirme').length
    return { confirmed, total: artists.length }
  }, [artists])

  // ── Statistiques matériel ──────────────────────────────────────────────────
  const materialStats = useMemo(() => {
    let missing = 0
    let toBring = 0
    let value = 0
    for (const m of materials) {
      if (m.status === 'manquant') missing += 1
      if (m.status === 'a_apporter') toBring += 1
      value += lineTotal(m.qty, m.unitPrice)
    }
    return { missing, toBring, value, total: materials.length }
  }, [materials])

  // ── Statistiques tâches ─────────────────────────────────────────────────────
  const taskStats = useMemo(() => {
    let done = 0
    let overdue = 0
    let criticalOpen = 0
    for (const t of tasks) {
      if (t.done) {
        done += 1
        continue
      }
      if (t.dueDate && t.dueDate < today) overdue += 1
      if (t.priority === 'critique') criticalOpen += 1
    }
    return { done, overdue, criticalOpen, total: tasks.length }
  }, [tasks, today])

  // ── Statistiques équipe ──────────────────────────────────────────────────────
  const memberStats = useMemo(() => {
    const partners = members.filter((m) => m.isPartner).length
    return { total: members.length, partners }
  }, [members])

  // ── Alertes ──────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: { id: string; icon: LucideIcon; tone: string; text: string; to: string }[] = []

    for (const t of tasks) {
      if (t.done || t.priority !== 'critique') continue
      list.push({
        id: `crit-${t.id}`,
        icon: AlertTriangle,
        tone: 'text-red-300',
        text: `Tâche critique à faire : ${t.title || 'Sans titre'}`,
        to: '/checklist',
      })
    }
    for (const t of tasks) {
      if (t.done || !t.dueDate || t.dueDate >= today || t.priority === 'critique') continue
      list.push({
        id: `late-${t.id}`,
        icon: Clock,
        tone: 'text-amber-300',
        text: `Tâche en retard : ${t.title || 'Sans titre'} (${formatDateShortFR(t.dueDate)})`,
        to: '/checklist',
      })
    }
    for (const m of materials) {
      if (m.status !== 'manquant') continue
      list.push({
        id: `mat-${m.id}`,
        icon: PackageX,
        tone: 'text-red-300',
        text: `Matériel manquant : ${m.name || 'Sans nom'}${m.qty > 1 ? ` ×${m.qty}` : ''}`,
        to: '/materiel',
      })
    }
    return list
  }, [tasks, materials, today])

  // ── Prochaines tâches (phase « avant », non faites) ─────────────────────────
  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => !t.done && t.phase === 'avant')
        .sort(compareUpcoming)
        .slice(0, 6),
    [tasks],
  )

  // ── Déroulé du jour (slots triés par heure, horaires invalides en fin) ──────
  const timeline = useMemo(
    () =>
      [...slots].sort((a, b) => {
        const ta = timeToMinutes(a.startTime)
        const tb = timeToMinutes(b.startTime)
        if (Number.isNaN(ta)) return 1
        if (Number.isNaN(tb)) return -1
        return ta - tb
      }),
    [slots],
  )

  const festivalTitle = festival.name + (festival.edition ? ` — ${festival.edition}` : '')

  return (
    <div className="space-y-6">
      <PageHeader
        title={festivalTitle}
        subtitle={festival.context || 'Tableau de bord'}
        actions={<Countdown date={festival.date} />}
      />

      {/* Infos clés */}
      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={16} className="text-kessoku-400" aria-hidden />
            Infos clés
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={CalendarClock} label="Date" value={formatDateFR(festival.date)} />
            <InfoRow
              icon={Clock}
              label="Horaires public"
              value={
                festival.startTime && festival.endTime
                  ? `${festival.startTime} – ${festival.endTime}`
                  : ''
              }
            />
            <InfoRow icon={Users} label="Accès équipe" value={festival.crewAccessTime} />
            <InfoRow icon={Truck} label="Dépose matériel" value={festival.loadInDeadline} />
            <InfoRow icon={MapPin} label="Lieu" value={festival.venue} />
            <InfoRow icon={MapPin} label="Ville" value={festival.city} />
          </div>
          {festival.context && (
            <p className="mt-4 border-t border-night-700 pt-4 text-sm text-slate-400">
              {festival.context}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Mic2}
          to="/artistes"
          accent="bg-kessoku-500/15 text-kessoku-300"
          label="Artistes confirmés"
          value={`${artistStats.confirmed} / ${artistStats.total}`}
          hint={artistStats.total === 0 ? 'Aucun artiste' : 'sur la programmation'}
        />
        <Stat
          icon={Guitar}
          to="/materiel"
          accent="bg-stellar-500/15 text-stellar-300"
          label="Inventaire"
          value={formatEUR(materialStats.value)}
          hint={`${materialStats.missing} manquant · ${materialStats.toBring} à apporter`}
        />
        <Stat
          icon={CheckSquare}
          to="/checklist"
          accent="bg-emerald-500/15 text-emerald-300"
          label="Tâches faites"
          value={`${taskStats.done} / ${taskStats.total}`}
          hint={`${taskStats.overdue} en retard · ${taskStats.criticalOpen} critique`}
        />
        <Stat
          icon={Users}
          to="/equipe"
          accent="bg-cyan-500/15 text-cyan-300"
          label="Équipe"
          value={String(memberStats.total)}
          hint={`dont ${memberStats.partners} partenaire${memberStats.partners > 1 ? 's' : ''}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alertes */}
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle size={16} className="text-amber-400" aria-hidden />
              Alertes
            </h2>
            {alerts.length > 0 && (
              <Badge tone="bg-red-500/15 text-red-300">{alerts.length}</Badge>
            )}
          </CardHeader>
          <CardBody>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-emerald-300">
                <CheckCircle2 size={18} aria-hidden />
                <span>Tout est sous contrôle, aucun point d’attention.</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={a.to}
                      className="flex items-start gap-3 rounded-xl border border-night-700 bg-night-800/40 px-3 py-2 transition hover:border-night-600 hover:bg-night-800"
                    >
                      <a.icon size={16} className={cn('mt-0.5 shrink-0', a.tone)} aria-hidden />
                      <span className="text-sm text-slate-200">{a.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Prochaines tâches */}
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ListChecks size={16} className="text-stellar-400" aria-hidden />
              Prochaines tâches
            </h2>
            <Link
              to="/checklist"
              className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
            >
              Voir tout
            </Link>
          </CardHeader>
          <CardBody>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">
                Aucune tâche « avant » en attente. Tout est prêt côté préparation.
              </p>
            ) : (
              <ul className="divide-y divide-night-700">
                {upcoming.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-200">{t.title || 'Sans titre'}</p>
                      {t.dueDate && (
                        <p className="text-xs text-slate-500">{formatDateShortFR(t.dueDate)}</p>
                      )}
                    </div>
                    <Badge tone={TASK_PRIORITIES[t.priority].badge}>
                      {TASK_PRIORITIES[t.priority].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Déroulé du jour */}
      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarClock size={16} className="text-kessoku-400" aria-hidden />
            Déroulé du jour
          </h2>
          <Link
            to="/conducteur"
            className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
          >
            Conducteur complet
          </Link>
        </CardHeader>
        <CardBody>
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aucun créneau planifié.{' '}
              <Link to="/conducteur" className="text-kessoku-300 hover:underline">
                Construire le déroulé →
              </Link>
            </p>
          ) : (
            <ol className="space-y-2">
              {timeline.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-night-700 bg-night-800/40 px-3 py-2"
                >
                  <div className="w-24 shrink-0 text-sm font-semibold tabular-nums text-slate-200">
                    {s.startTime}
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      →{addMinutes(s.startTime, s.durationMin)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-100">{s.title || 'Sans titre'}</p>
                    <p className="truncate text-xs text-slate-500">{s.stage}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-xs text-slate-500 sm:inline">
                      {formatDuration(s.durationMin)}
                    </span>
                    <Badge tone={SLOT_TYPES[s.type].badge}>{SLOT_TYPES[s.type].label}</Badge>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
