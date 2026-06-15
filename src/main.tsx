import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { initCollab } from './lib/collab'
import './index.css'

// Service worker (offline + installable). autoUpdate => maj silencieuse.
registerSW({ immediate: true })

// Reconnexion collaborative si une session a été configurée.
initCollab()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
