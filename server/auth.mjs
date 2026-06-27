// Gestion des jetons JWT.
// Le secret vient de JWT_SECRET, sinon il est généré et persisté dans le volume
// de données (pour que les sessions survivent aux redémarrages). Jamais sur git.

import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = process.env.DATA_DIR || './data'

function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  mkdirSync(DATA_DIR, { recursive: true })
  const file = join(DATA_DIR, 'jwt.secret')
  if (existsSync(file)) return readFileSync(file, 'utf8').trim()
  const secret = randomBytes(48).toString('hex')
  writeFileSync(file, secret, { mode: 0o600 })
  return secret
}

const SECRET = loadSecret()

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, tv: user.token_version ?? 0 },
    SECRET,
    { algorithm: 'HS256', expiresIn: '7d' },
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET, { algorithms: ['HS256'] })
  } catch {
    return null
  }
}

// État OAuth signé (anti-CSRF), courte durée de vie.
export function signState(payload) {
  return jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '10m' })
}
export function verifyState(token) {
  try {
    return jwt.verify(token, SECRET, { algorithms: ['HS256'] })
  } catch {
    return null
  }
}
