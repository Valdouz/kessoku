// Normalise un émoji unicode pour une comparaison fiable
// (ex. ❤️ = U+2764 (+ sélecteur de variante U+FE0F) selon la source).
export function normalizeEmoji(input: string | null | undefined): string {
  return (input ?? '').replace(/️/g, '').trim()
}
