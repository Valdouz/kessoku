// Choix d'un émoji « cœur » à la couleur d'un rôle Discord.
export interface Heart {
  emoji: string
  rgb: [number, number, number]
}

// Palette de cœurs (ordre = préférence en cas de repli).
export const HEARTS: Heart[] = [
  { emoji: '❤️', rgb: [237, 66, 69] }, // rouge
  { emoji: '🧡', rgb: [245, 135, 35] }, // orange
  { emoji: '💛', rgb: [254, 231, 92] }, // jaune
  { emoji: '💚', rgb: [87, 242, 135] }, // vert
  { emoji: '💙', rgb: [59, 165, 216] }, // bleu
  { emoji: '💜', rgb: [155, 89, 182] }, // violet
  { emoji: '💗', rgb: [255, 133, 192] }, // rose
  { emoji: '🤎', rgb: [121, 80, 55] }, // marron
  { emoji: '🖤', rgb: [35, 39, 42] }, // noir
  { emoji: '🤍', rgb: [255, 255, 255] }, // blanc / défaut
]

const WHITE = HEARTS[HEARTS.length - 1]

function toRgb(color: number): [number, number, number] {
  return [(color >> 16) & 255, (color >> 8) & 255, color & 255]
}
function dist(a: [number, number, number], b: [number, number, number]): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

/** Position d'un cœur dans la palette (pour un affichage trié « arc-en-ciel »). */
export function heartIndex(emoji: string): number {
  const i = HEARTS.findIndex((h) => h.emoji === emoji)
  return i === -1 ? HEARTS.length : i
}

/** Cœur le plus proche de la couleur du rôle (color = 0xRRGGBB ; 0 = sans couleur). */
export function heartForColor(color: number): Heart {
  if (!color) return WHITE
  const rgb = toRgb(color)
  return HEARTS.reduce((best, h) => (dist(h.rgb, rgb) < dist(best.rgb, rgb) ? h : best))
}

/**
 * Propose un cœur à la couleur du rôle, en évitant ceux déjà pris.
 * Renvoie '' si tous les cœurs sont déjà utilisés.
 */
export function suggestHeart(color: number, used: Set<string>): string {
  const first = heartForColor(color)
  if (!used.has(first.emoji)) return first.emoji
  const rgb = color ? toRgb(color) : WHITE.rgb
  const free = HEARTS.filter((h) => !used.has(h.emoji)).sort(
    (a, b) => dist(a.rgb, rgb) - dist(b.rgb, rgb),
  )
  return free[0]?.emoji ?? ''
}
