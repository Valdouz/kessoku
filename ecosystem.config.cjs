// Déploiement PM2 sans dépendance supplémentaire (serveur statique intégré).
// Prérequis :  npm install && npm run build   (génère ./dist)
// Démarrer   :  pm2 start ecosystem.config.cjs   ->  http://localhost:3000
// Au boot    :  pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'kessoku',
      script: 'serve', // serveur statique intégré à PM2
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true', // fallback vers index.html
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
  ],
}
