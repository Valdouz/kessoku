# Contribuer à Kessoku

Merci de l'intérêt ! Kessoku est un outil de régie open source (MIT).

## Mise en place

```bash
npm install
npm run dev
```

- **Node ≥ 20**.
- Avant de pousser : `npm run build` doit passer (TypeScript strict + build Vite).

## Conventions

- **Langue de l'UI : français.** Le code (noms de variables, commentaires) peut être en français.
- **TypeScript strict** : pas de `any` implicite, pas d'imports/variables inutilisés. Utilise `import type` pour les types.
- **Local-first** : toute donnée passe par le store ([`src/lib/store.ts`](src/lib/store.ts)). Pas d'état de données en local component.
- **UI** : réutilise le kit de [`src/components/ui`](src/components/ui) et les libellés/couleurs de [`src/lib/labels.ts`](src/lib/labels.ts). Mobile-first, thème sombre.
- **Un module = un dossier** dans `src/features/`. Une nouvelle entrée de menu se déclare dans [`src/nav.ts`](src/nav.ts) et une route dans [`src/App.tsx`](src/App.tsx).

## Modèle de données

Toutes les entités sont définies dans [`src/lib/types.ts`](src/lib/types.ts) et horodatées (`createdAt`/`updatedAt`)
pour préparer la future synchronisation collaborative ([`src/lib/sync.ts`](src/lib/sync.ts)).

## Sécurité

- **Aucun secret dans le dépôt.** Les clés (futur backend) vont dans un `.env` local (gitignoré) — voir [`.env.example`](.env.example).

## Commits & PR

- Commits clairs (français ou anglais). Une PR = un sujet.
- Décris le « pourquoi », pas seulement le « quoi ».
