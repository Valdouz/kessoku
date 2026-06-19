import {
  CalendarClock,
  CheckSquare,
  FileText,
  Guitar,
  HeartHandshake,
  Mic2,
  Network,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  /** Affiché dans la barre du bas mobile (les principaux). */
  primary?: boolean
}

export const NAV: NavItem[] = [
  { path: '/', label: 'Accueil', icon: Sparkles, primary: true },
  { path: '/conducteur', label: 'Conducteur', icon: CalendarClock, primary: true },
  { path: '/artistes', label: 'Artistes', icon: Mic2, primary: true },
  { path: '/materiel', label: 'Matériel', icon: Guitar, primary: true },
  { path: '/checklist', label: 'Checklist', icon: CheckSquare, primary: true },
  { path: '/equipe', label: 'Équipe', icon: Users },
  { path: '/benevoles', label: 'Bénévoles', icon: HeartHandshake },
  { path: '/organigramme', label: 'Organigramme', icon: Network },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/reglages', label: 'Réglages', icon: Settings },
]
