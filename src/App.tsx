import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BRAND } from '@/brand'
import { Layout } from './components/Layout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ConducteurPage } from './features/conducteur/ConducteurPage'
import { ArtistesPage } from './features/artistes/ArtistesPage'
import { InventairePage } from './features/inventaire/InventairePage'
import { ChecklistPage } from './features/checklist/ChecklistPage'
import { EquipePage } from './features/equipe/EquipePage'
import { OrganigrammePage } from './features/organigramme/OrganigrammePage'
import { ReglagesPage } from './features/reglages/ReglagesPage'

export default function App() {
  // BRAND devient la seule source effective du titre au runtime (index.html
  // reste un fallback statique pour le chargement initial / SEO).
  useEffect(() => {
    document.title = `${BRAND.name} — ${BRAND.tagline}`
  }, [])

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
