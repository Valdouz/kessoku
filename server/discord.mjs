// OAuth2 « Se connecter avec Discord ».
// Désactivé tant que DISCORD_CLIENT_ID + DISCORD_CLIENT_SECRET ne sont pas définis.

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || ''
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || ''

export const discordEnabled = () => Boolean(CLIENT_ID && CLIENT_SECRET)

/** URL d'autorisation Discord (scope identify uniquement). */
export function authorizeUrl(redirectUri, state) {
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'identify',
    redirect_uri: redirectUri,
    state,
    prompt: 'consent',
  })
  return `https://discord.com/oauth2/authorize?${p.toString()}`
}

// Un appel OAuth ne doit jamais pendre indéfiniment (sinon page blanche côté user).
const TIMEOUT_MS = 10_000

/** Échange le code d'autorisation contre un access_token. */
export async function exchangeCode(code, redirectUri) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })
  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`token exchange ${res.status}`)
  return res.json()
}

/** Récupère l'identité Discord (id, username…) à partir d'un access_token. */
export async function fetchDiscordUser(accessToken) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`user fetch ${res.status}`)
  return res.json()
}
