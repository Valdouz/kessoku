import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BRAND } from '@/brand'
import { useAuth } from '@/lib/auth'
import { initCollab } from '@/lib/collab'
import { LoginPage } from './features/auth/LoginPage'
import { Layout } from './components/Layout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ConducteurPage } from './features/conducteur/ConducteurPage'
import { ArtistesPage } from './features/artistes/ArtistesPage'
import { InventairePage } from './features/inventaire/InventairePage'
import { ChecklistPage } from './features/checklist/ChecklistPage'
import { EquipePage } from './features/equipe/EquipePage'
import { VolunteersPage } from './features/benevoles/VolunteersPage'
import { OrganigrammePage } from './features/organigramme/OrganigrammePage'
import { DocumentsPage } from './features/documents/DocumentsPage'
import { ReglagesPage } from './features/reglages/ReglagesPage'

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-night-900 text-slate-400">{children}</div>
}

export default function App() {
  const status = useAuth((s) => s.status)

  useEffect(() => {
    document.title = `${BRAND.name} — ${BRAND.tagline}`
  }, [])

  // Vérifie la session au démarrage, puis connecte la synchro si authentifié.
  // Gère aussi le retour de « Se connecter avec Discord » (paramètres dans l'URL).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dlogin = params.get('dlogin')
    const dlink = params.get('dlink')
    const derr = params.get('derr')
    if (dlogin || dlink || derr) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }

    const errMsg = (r: string): string =>
      ({
        notlinked:
          "Ce compte Discord n'est lié à aucun compte. Connecte-toi puis lie ton Discord dans Réglages.",
        taken: 'Ce compte Discord est déjà lié à un autre utilisateur.',
        disabled: 'La connexion Discord est désactivée.',
        state: 'Lien expiré, réessaie.',
        oauth: 'Échec de la connexion Discord.',
      })[r] || 'Échec de la connexion Discord.'

    if (dlogin) {
      useAuth.setState({ status: 'loading' })
      useAuth
        .getState()
        .claimDiscordLogin(dlogin)
        .then((ok) => (ok ? initCollab() : useAuth.setState({ status: 'anon' })))
      return
    }
    if (dlink === 'ok') useAuth.getState().setNotice({ kind: 'ok', text: 'Compte Discord lié ✓' })
    if (derr) {
      useAuth.setState({ error: errMsg(derr) })
      useAuth.getState().setNotice({ kind: 'err', text: errMsg(derr) })
    }

    useAuth
      .getState()
      .bootstrap()
      .then(() => {
        if (useAuth.getState().token) initCollab()
      })
  }, [])

  if (status === 'loading') return <FullScreen>Chargement…</FullScreen>
  if (status !== 'authed') return <LoginPage />

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/conducteur" element={<ConducteurPage />} />
          <Route path="/artistes" element={<ArtistesPage />} />
          <Route path="/materiel" element={<InventairePage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/equipe" element={<EquipePage />} />
          <Route path="/benevoles" element={<VolunteersPage />} />
          <Route path="/organigramme" element={<OrganigrammePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/reglages" element={<ReglagesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
