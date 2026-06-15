<div align="center">

# 結束 Kessoku

**Outil de régie & d'organisation de festival — collaboratif temps réel, multi-comptes, open source.**

Conçu à l'origine pour un festival associatif, utilisable pour n'importe quel concert ou événement.

</div>

---

## C'est quoi ?

Kessoku regroupe tout ce qu'une petite régie doit suivre pour monter un festival, dans une seule app web qui marche **sur téléphone comme sur ordi**, en **temps réel à plusieurs** :

- 🔐 **Comptes & accès** — connexion par identifiant/mot de passe (hashés en base). Les comptes sont créés par l'admin ; rien n'est accessible sans se connecter.
- 🗓️ **Multi-événements** — gère plusieurs concerts/festivals dans la même app, bascule de l'un à l'autre, et **reprends des données** d'un événement à l'autre (matériel, équipe, checklist…) à la création.
- 🛰️ **Accueil** — compte à rebours, infos clés, alertes, stats (artistes confirmés, matériel manquant, tâches en retard, valeur de l'inventaire).
- 🎚️ **Conducteur** — le déroulé minute par minute du jour J (scène ouverte, danse, DJ set…), recalage auto des horaires, détection des trous/chevauchements, impression.
- 🎤 **Artistes** — fiches groupes/solos : statut, besoins techniques, backline, contacts, soundcheck.
- 🎸 **Matériel** — inventaire technique groupé par catégorie, qui apporte quoi, ce qui manque, valeur totale.
- ✅ **Checklist** — tâches régie par phase (avant / montage / pendant / démontage / après), assignées, avec échéances.
- 🧑‍🤝‍🧑 **Équipe** — annuaire de la régie, des partenaires et des contacts externes (appel/mail en un clic).
- ⚙️ **Réglages** — mon compte (mot de passe, déconnexion), gestion des **utilisateurs** (admin), infos événement, **export/import JSON**.

> **Le nom ?** *Kessoku* (結束) est le groupe de l'anime *Bocchi the Rock!*. Le mot veut dire « **souder ensemble** » (un outil collaboratif) et désigne aussi le **serre-câble** (結束バンド), l'accessoire fétiche de toute régie. 🔧

## Démarrage rapide (développement)

Prérequis : **Node.js ≥ 20**.

```bash
npm install
npm run dev        # front : http://localhost:5173
# dans un autre terminal — backend (auth + synchro + données) :
ADMIN_PASSWORD=test npm run server   # http://localhost:1234 (proxifié par /api et /sync)
```

Build de production (fichiers statiques dans `dist/`) :

```bash
npm run build
npm run preview  # prévisualise le build
```

## Déploiement

### 🐳 Docker (recommandé)

1. Crée un fichier **`.env`** (gitignoré) à la racine — au minimum le mot de passe admin initial :
   ```bash
   cp .env.example .env
   # édite ADMIN_PASSWORD (et éventuellement ADMIN_USERNAME / JWT_SECRET)
   ```
2. Lance les deux services (app nginx + backend auth/synchro) :
   ```bash
   docker compose up -d --build
   # -> http://localhost:8080
   ```
3. Ouvre l'app, connecte-toi avec `ADMIN_USERNAME` / `ADMIN_PASSWORD`, puis crée les comptes
   de la régie dans **Réglages → Utilisateurs**.

Le compte admin n'est créé qu'au **premier** démarrage (base vide). Les données (comptes + festival)
vivent dans le volume Docker `kessoku-data` (SQLite) — pense à le sauvegarder. Port : `docker-compose.yml`.

### ⚙️ PM2 (sur un VPS, sans Docker)

```bash
npm install && npm run build
pm2 start ecosystem.config.cjs   # serveur statique intégré -> http://localhost:3000
pm2 save && pm2 startup          # relance au reboot
```

### ☁️ Hébergement statique (Netlify, GitHub Pages, Vercel…)

`npm run build` puis publie le dossier `dist/`. L'app utilise un **HashRouter** et des
chemins relatifs : elle fonctionne sous n'importe quel sous-dossier, sans config serveur.

## Installable (PWA) 📱

Kessoku est une **PWA** : depuis le navigateur (mobile ou desktop), « Ajouter à l'écran d'accueil ».
Elle s'ouvre alors comme une app et **fonctionne hors-ligne** — idéal sur site, là où le réseau est capricieux.

## Données, comptes & confidentialité

- **Accès protégé** : aucune donnée n'est accessible sans se connecter. Comptes créés par l'admin, mots de passe **hashés (bcrypt)** en base SQLite, sessions par **JWT**.
- **Données sur le serveur** : les données du festival vivent côté serveur (SQLite, volume Docker `kessoku-data`) et sont synchronisées en temps réel. Le navigateur en garde un cache pour rester réactif/hors-ligne.
- **Aucun service tiers** : tout est auto-hébergé. **Aucun secret dans le dépôt** — mot de passe admin et secret JWT vont dans `.env` (gitignoré) ou sont générés au runtime.
- **Sauvegarde / partage** : *Réglages → Exporter* génère un `.json` (sauvegarde ou bascule d'instance) ; *Importer* le recharge.

## Collaboration en temps réel 🎚️

Une fois connectés, les membres éditent **en même temps** (déroulé, matériel, checklist…), avec
**présence** (qui est en ligne) et **fusion automatique** (last-write-wins par entité). Le **backend est
autoritaire** : il stocke l'état et le sert aux nouveaux arrivants. La connexion est **automatique** après
identification — rien à configurer.

Avec Docker, **un seul port** est exposé (`8080`) : nginx sert l'app **et** proxifie `/api` (auth) et
`/sync` (WebSocket) vers le backend. Le client vise automatiquement le **même domaine** (`ws` en HTTP /
`wss` en HTTPS).

### Derrière un tunnel Cloudflare (HTTPS) ☁️

Comme tout passe par un seul port, il suffit d'exposer l'app. Exemple `~/.cloudflared/config.yml` :

```yaml
tunnel: <ID-DU-TUNNEL>
credentials-file: /root/.cloudflared/<ID-DU-TUNNEL>.json
ingress:
  - hostname: kessoku.mon-domaine.fr
    service: http://localhost:8080      # WebSocket /sync inclus (Cloudflare gère le ws)
  - service: http_status:404
```

```bash
cloudflared tunnel run <NOM-DU-TUNNEL>
```

L'app est alors en `https://kessoku.mon-domaine.fr` et le collaboratif passe en `wss://…/sync`
automatiquement (zéro réglage côté client). *(Le serveur de synchro sur un hôte séparé ? définissez
`VITE_SYNC_URL` au build — voir [`.env.example`](.env.example).)*

## Pile technique

**Front** : Vite · React 18 · TypeScript (strict) · Tailwind CSS · React Router (HashRouter) · Zustand · vite-plugin-pwa · lucide-react.
**Backend** (`server/`) : Node · Express · `ws` (WebSocket) · better-sqlite3 · bcryptjs · jsonwebtoken.

## Structure

```
src/
  lib/          types, store (zustand, multi-événements), labels, time, io (export/import),
                auth (login/JWT), collab (client temps réel) + syncProtocol (diff/merge)
  data/         seed de démo (festival + concert) + fabriques d'entités
  components/   UI kit (ui/) + Layout + EventSwitcher + CollabIndicator
  features/     un dossier par module (auth, dashboard, conducteur, artistes, inventaire,
                checklist, equipe, organigramme, evenements, collab, reglages)
  brand.ts      identité de l'app (renommer ici)
server/         backend Node : index.mjs (API + WS) · auth.mjs (JWT) · db.mjs (SQLite)
                · sync.mjs (merge) · Dockerfile
```

## Licence

[MIT](LICENSE) © 2026 valdouz — contributions bienvenues, voir [CONTRIBUTING](CONTRIBUTING.md).
