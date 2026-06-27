# Kessoku — Bot Discord

Bot Discord **TypeScript**, multi-serveurs, avec **handler de commandes** (slash commands) et
base **SQLite** (`better-sqlite3`). Fonctions : **autorole** et **rôles par réaction**. Statut du
bot = **compte à rebours** du prochain événement (lu via l'API du site, repli sur `.env`).

## Prérequis
- Node.js ≥ 20.
- Une application Discord (https://discord.com/developers) avec un **bot**.
- Dans le portail → **Bot → Privileged Gateway Intents** : activer **Server Members Intent**
  (requis pour l'autorole à l'arrivée d'un membre).
- Permissions du bot sur le serveur : **Gérer les rôles** et **Ajouter des réactions**
  (pour poser les émojis des panneaux). L'intent *Message Content* n'est **pas** nécessaire.

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
- `/festival infos` — date, horaires, lieu du prochain événement (lu sur le site).
- `/festival programme` — le déroulé du jour (conducteur).
- `/festival artistes` — la programmation artistique.
- `/festival contacts` — feuille de contacts de l'équipe (réservé *Gérer le serveur*, en éphémère).

> `/festival` nécessite `SITE_API_URL` + `SITE_API_TOKEN` (= `SERVICE_TOKEN` du backend).

## Accueil & annonces
- `/accueil salon #salon` — message de bienvenue (embed + infos événement) à l'arrivée d'un membre.
  `/accueil apercu` pour prévisualiser, `/accueil off` pour désactiver.
- `/annonces salon #salon` — **rappels automatiques** (J-7, J-3, J-1, jour J) postés tout seuls.
  `/annonces test` pour un aperçu immédiat, `/annonces off` pour désactiver.
- `/autorole set` — ouvre un **sélecteur de rôle** ; le rôle choisi est attribué automatiquement
  aux nouveaux membres. Le bot **propose un émoji cœur à la couleur du rôle** (s'il n'est pas déjà pris).
- `/autorole status` — affiche la configuration.
- `/autorole disable` — désactive l'autorole.

> Pour que l'autorole fonctionne : le rôle du bot doit être **au-dessus** du rôle à attribuer,
> et le bot doit avoir la permission **Gérer les rôles**.

## Rôles par réaction
Un **panneau** (embed) sur lequel les membres réagissent pour s'attribuer un rôle.
- `/reactionrole panel [titre] [description]` — **tu choisis les rôles, le bot écrit le message
  automatiquement** : un sélecteur de rôles s'ouvre (jusqu'à 25), puis le bot poste le panneau avec
  un **émoji cœur** à la couleur de chaque rôle et pose les réactions.
- `/reactionrole add [message]` — ajoute d'autres rôles à un panneau existant (mêmes cœurs auto).
  Sans `message`, vise le dernier panneau du salon.
- `/reactionrole remove [message]` — retire un rôle (et sa réaction) du panneau.
- `/reactionrole list [message]` — affiche les rôles d'un panneau.

> Réagir = obtenir le rôle ; retirer sa réaction = perdre le rôle. Le bot fonctionne même sur des
> messages anciens (gestion des *partials*), pas besoin de l'intent *Message Content*.

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
  db.ts                 SQLite (guild_settings, role_emojis, reaction_panels, reaction_roles)
  commands/             une commande = un fichier (chargé automatiquement)
  events/               ready · interactionCreate · guildMemberAdd · messageReaction(Add|Remove)
  lib/                  command (types) · loaders · hearts · emoji · reactionRoles · presence · siteApi
```
