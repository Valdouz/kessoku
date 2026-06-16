// ──────────────────────────────────────────────────────────────────────────
// Réinitialise (ou crée) un compte ADMIN — utile si le mot de passe est oublié.
// Agit sur la MÊME base que le serveur (variable DATA_DIR).
//
// Sécurité : ce script n'est PAS exposé sur le réseau. Il nécessite un accès shell
// au serveur (qui permettrait de toute façon de modifier la base directement).
//
// Local (depuis la racine du repo) :
//   node server/reset-admin.mjs admin monNouveauMotDePasse
//   # ou sans laisser le mot de passe dans l'historique shell :
//   NEW_PASSWORD=monMotDePasse node server/reset-admin.mjs admin
// En prod (conteneur Docker) :
//   docker compose exec -e NEW_PASSWORD=monMotDePasse api node reset-admin.mjs admin
//
// Réinitialiser un mot de passe révoque les sessions en cours de ce compte.
// ──────────────────────────────────────────────────────────────────────────

import { getUserByUsername, createUser, setPassword, setRole } from './db.mjs'

const args = process.argv.slice(2)
let username = 'admin'
let password = process.env.NEW_PASSWORD
if (args.length >= 2) {
  username = args[0]
  password = password || args[1]
} else if (args.length === 1) {
  // Un seul argument : c'est l'identifiant si NEW_PASSWORD est fourni, sinon le mot de passe.
  if (password) username = args[0]
  else password = args[0]
}

if (!password || password.length < 6) {
  console.error('Usage : node server/reset-admin.mjs [identifiant] <mot_de_passe (≥ 6 caractères)>')
  process.exit(1)
}

const existing = getUserByUsername(username)
if (existing) {
  setPassword(existing.id, password)
  setRole(existing.id, 'admin')
  console.log(`✔ Mot de passe réinitialisé pour « ${username} » (admin). Sessions existantes révoquées.`)
} else {
  createUser(username, password, 'admin')
  console.log(`✔ Compte admin « ${username} » créé.`)
}
process.exit(0)
