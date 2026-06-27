// Client minimal vers l'API du site Kessoku (interaction future).
// Configuré par SITE_API_URL + SITE_API_TOKEN. Non requis pour l'autorole.
const BASE = process.env.SITE_API_URL ?? ''
const TOKEN = process.env.SITE_API_TOKEN ?? ''

export const siteApiConfigured = (): boolean => Boolean(BASE)

export async function siteApi<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error('SITE_API_URL non configuré')
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Site API ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}
