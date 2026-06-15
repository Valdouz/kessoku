import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// base './' + HashRouter => fonctionne sur n'importe quel hébergeur statique
// (GitHub Pages, Netlify, ouverture directe du dossier) sans config serveur.
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // En dev : proxifie le WebSocket /sync vers le serveur de synchro local
  // (npm run sync, port 1234), pour reproduire le comportement de production.
  server: {
    proxy: {
      // En dev : API d'auth + WebSocket /sync vers le backend local (npm run server).
      '/api': { target: 'http://localhost:1234', changeOrigin: true },
      '/sync': { target: 'ws://localhost:1234', ws: true },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Kessoku — Régie festival',
        short_name: 'Kessoku',
        description: "Outil de régie et d'organisation de festival",
        theme_color: '#0b0a14',
        background_color: '#0b0a14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
})
