# Kessoku — Bot Discord

Bot Discord **TypeScript**, multi-serveurs, avec **handler de commandes** (slash commands) et
base **SQLite** (`better-sqlite3`). Première fonction : **autorole**. Statut du bot = **compte à
rebours** du prochain événement (lu via l'API du site, repli sur `.env`).

## Prérequis
- Node.js ≥ 20.
- Une application Discord (https://discord.com/developers) avec un **bot**.
- Dans le portail → **Bot → Privileged Gateway Intents** : activer **Server Members Intent**
  (requis pour l'autorole à l'arrivée d'un membre).

## Configuration
```bash
cp .env.example .env       # renseigne DISCORD_TOKEN (CLIENT_ID dérivé du token si vide)
npm install
```
Variables utiles : `DISCORD_GUILD_ID` (déploiement instantané des commandes sur un serveur de test),
`NEXT_EVENT_NAME` / `NEXT_EVENT_DATE` (repli pour le statut), `SITE_API_URL` / `SITE_API_TOKEN`
(pour lire le prochain événement depuis le site).

## Démarrer
```bash
# Dev (rechargement à chaud)
npm run deploy:dev        # enregistre les slash commands
npm run dev

# Production
npm run build
npm run deploy            # enregistre les slash commands
npm start                 # ou via PM2 :  pm2 start dist/index.js --name kessoku-bot
```

## Commandes
- `/ping` — vérifie que le bot répond.
- `/autorole set` — ouvre un **sélecteur de rôle** ; le rôle choisi est attribué automatiquement
  aux nouveaux membres. Le bot **propose un émoji cœur à la couleur du rôle** (s'il n'est pas déjà pris).
- `/autorole status` — affiche la configuration.
- `/autorole disable` — désactive l'autorole.

> Pour que l'autorole fonctionne : le rôle du bot doit être **au-dessus** du rôle à attribuer,
> et le bot doit avoir la permission **Gérer les rôles**.

## Statut (compte à rebours)
Le bot affiche « 🎪 *Événement* dans X jours / X heures ». Source :
1. l'API du site `GET /api/next-event` si `SITE_API_URL` + `SITE_API_TOKEN` sont définis
   (le backend doit avoir `SERVICE_TOKEN` = `SITE_API_TOKEN`) ;
2. sinon les variables `NEXT_EVENT_NAME` / `NEXT_EVENT_DATE`.

## Docker (optionnel)
```bash
docker build -t kessoku-bot .
docker run -d --name kessoku-bot --env-file .env -v kessoku-bot-data:/data kessoku-bot
```

## Architecture
```
src/
  index.ts              client + handler + événements
  deploy-commands.ts    enregistrement des slash commands
  db.ts                 SQLite (guild_settings, role_emojis)
  commands/             une commande = un fichier (chargé automatiquement)
  events/               ready · interactionCreate · guildMemberAdd
  lib/                  command (types) · loaders · hearts · presence · siteApi
```
