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
import { OrganigrammePage } from './features/organigramme/OrganigrammePage'
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
  useEffect(() => {
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
          <Route path="/organigramme" element={<OrganigrammePage />} />
          <Route path="/reglages" element={<ReglagesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
