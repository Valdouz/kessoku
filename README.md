<div align="center">

# 結束 Kessoku

**Outil de régie & d'organisation de festival — local-first, collaboratif (à venir), open source.**

Conçu à l'origine pour un festival associatif, utilisable pour n'importe quel concert ou événement.

</div>

---

## C'est quoi ?

Kessoku regroupe tout ce qu'une petite régie doit suivre pour monter un festival, dans une seule app web qui marche **sur téléphone comme sur ordi**, **hors-ligne**, et **sans compte ni serveur** :

- 🗓️ **Multi-événements** — gère plusieurs concerts/festivals dans la même app, bascule de l'un à l'autre, et **reprends des données** d'un événement à l'autre (matériel, équipe, checklist…) à la création.
- 🛰️ **Accueil** — compte à rebours, infos clés, alertes, stats (artistes confirmés, matériel manquant, tâches en retard, valeur de l'inventaire).
- 🎚️ **Conducteur** — le déroulé minute par minute du jour J (scène ouverte, danse, DJ set…), recalage auto des horaires, détection des trous/chevauchements, impression.
- 🎤 **Artistes** — fiches groupes/solos : statut, besoins techniques, backline, contacts, soundcheck.
- 🎸 **Matériel** — inventaire technique groupé par catégorie, qui apporte quoi, ce qui manque, valeur totale.
- ✅ **Checklist** — tâches régie par phase (avant / montage / pendant / démontage / après), assignées, avec échéances.
- 🧑‍🤝‍🧑 **Équipe** — annuaire de la régie, des partenaires et des contacts externes (appel/mail en un clic).
- ⚙️ **Réglages** — infos festival, **export/import JSON** (pour partager avec la régie) et données d'exemple.

> **Le nom ?** *Kessoku* (結束) est le groupe de l'anime *Bocchi the Rock!*. Le mot veut dire « **souder ensemble** » (un outil collaboratif) et désigne aussi le **serre-câble** (結束バンド), l'accessoire fétiche de toute régie. 🔧

## Démarrage rapide (développement)

Prérequis : **Node.js ≥ 20**.

```bash
npm install
npm run dev      # http://localhost:5173
```

Build de production (fichiers statiques dans `dist/`) :

```bash
npm run build
npm run preview  # prévisualise le build
```

## Déploiement

### 🐳 Docker (recommandé) — une commande

```bash
docker compose up -d --build
# -> http://localhost:8080
```

Build multi-étapes (Node pour compiler, **nginx** pour servir). Image légère, redémarrage auto.
Pour changer le port, édite `docker-compose.yml` (`"8080:80"`).

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

## Données & confidentialité

- **Local-first** : toutes les données vivent dans le navigateur (localStorage). En solo, rien n'est envoyé sur un serveur.
- **Partage hors-ligne** : *Réglages → Exporter* génère un `.json` à envoyer à la régie, qui l'importe.
- **Collaboratif temps réel** : voir ci-dessous. Tout reste local-first ; la synchro est un bonus quand on est connecté.

## Collaboration en temps réel 🎚️

Plusieurs personnes de la régie peuvent éditer **en même temps** (déroulé, matériel, checklist…),
avec **présence** (qui est en ligne) et **fusion automatique** (last-write-wins par entité).

Comment ça marche : un petit **serveur de synchro WebSocket auto-hébergé** relaie les changements
entre les membres d'une même *room*. Il ne stocke **aucune donnée** (tout vit dans les navigateurs) et
ne dépend d'**aucun service tiers**. Le *code de room* est un secret partagé choisi dans l'app — **jamais commité**.

Avec Docker, **un seul port** est exposé (`8080`) : nginx sert l'app **et** proxifie le WebSocket
`/sync` vers le serveur de synchro. Le client vise automatiquement le **même domaine** (`/sync`,
`ws` en HTTP / `wss` en HTTPS) — **rien à configurer**.

```bash
docker compose up -d --build       # app + collaboratif sur http://localhost:8080
# (dev sans Docker :  npm run dev  + dans un autre terminal  npm run sync)
```

Puis dans l'app : **Réglages → Collaboration** → votre nom + un **code de room** commun → *Se connecter*.
Partagez le code de room à la régie. C'est tout.

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

Vite · React 18 · TypeScript (strict) · Tailwind CSS · React Router (HashRouter) · Zustand (persist) · vite-plugin-pwa · lucide-react · `ws` (serveur de synchro).

## Structure

```
src/
  lib/          types, store (zustand+persist, multi-événements), labels, time,
                io (export/import), collab (client temps réel) + syncProtocol (diff/merge)
  data/         seed de démo (festival + concert) + fabriques d'entités
  components/   UI kit (ui/) + Layout + EventSwitcher + CollabIndicator
  features/     un dossier par module (dashboard, conducteur, artistes, inventaire,
                checklist, equipe, organigramme, evenements, collab, reglages)
  brand.ts      identité de l'app (renommer ici)
server/         sync-server.mjs — relais WebSocket (npm run sync)
```

## Licence

[MIT](LICENSE) © 2026 valdouz — contributions bienvenues, voir [CONTRIBUTING](CONTRIBUTING.md).
