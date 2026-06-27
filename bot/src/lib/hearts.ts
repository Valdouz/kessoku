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

// Replis quand les cœurs d'un panneau sont épuisés : ronds puis carrés, mêmes teintes.
const CIRCLES: Heart[] = [
  { emoji: '🔴', rgb: [220, 40, 40] },
  { emoji: '🟠', rgb: [245, 135, 35] },
  { emoji: '🟡', rgb: [253, 203, 40] },
  { emoji: '🟢', rgb: [60, 180, 75] },
  { emoji: '🔵', rgb: [45, 120, 220] },
  { emoji: '🟣', rgb: [155, 89, 182] },
  { emoji: '🟤', rgb: [121, 80, 55] },
  { emoji: '⚫', rgb: [35, 39, 42] },
  { emoji: '⚪', rgb: [255, 255, 255] },
]
const SQUARES: Heart[] = [
  { emoji: '🟥', rgb: [220, 40, 40] },
  { emoji: '🟧', rgb: [245, 135, 35] },
  { emoji: '🟨', rgb: [253, 203, 40] },
  { emoji: '🟩', rgb: [60, 180, 75] },
  { emoji: '🟦', rgb: [45, 120, 220] },
  { emoji: '🟪', rgb: [155, 89, 182] },
  { emoji: '🟫', rgb: [121, 80, 55] },
  { emoji: '⬛', rgb: [35, 39, 42] },
  { emoji: '⬜', rgb: [255, 255, 255] },
]
// Groupes par ordre de préférence ; palette plate pour le tri d'affichage.
const GROUPS: Heart[][] = [HEARTS, CIRCLES, SQUARES]
const PALETTE: Heart[] = GROUPS.flat()

function toRgb(color: number): [number, number, number] {
  return [(color >> 16) & 255, (color >> 8) & 255, color & 255]
}
function dist(a: [number, number, number], b: [number, number, number]): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}
function nearest(group: Heart[], rgb: [number, number, number]): Heart {
  return group.reduce((best, h) => (dist(h.rgb, rgb) < dist(best.rgb, rgb) ? h : best))
}

/** Position d'un émoji dans la palette (pour un affichage trié « arc-en-ciel »). */
export function emojiIndex(emoji: string): number {
  const i = PALETTE.findIndex((h) => h.emoji === emoji)
  return i === -1 ? PALETTE.length : i
}

/** Cœur le plus proche de la couleur du rôle (color = 0xRRGGBB ; 0 = sans couleur). */
export function heartForColor(color: number): Heart {
  if (!color) return WHITE
  return nearest(HEARTS, toRgb(color))
}

/**
 * Propose un cœur à la couleur du rôle, en évitant ceux déjà pris.
 * Renvoie '' si tous les cœurs sont déjà utilisés.
 */
export function suggestHeart(color: number, used: Set<string>): string {
  const first = heartForColor(color)
  if (!used.has(first.emoji)) return first.emoji
  const rgb = color ? toRgb(color) : WHITE.rgb
  const free = HEARTS.filter((h) => !used.has(h.emoji))
  return free.length ? nearest(free, rgb).emoji : ''
}

/**
 * Propose un émoji à la couleur du rôle, unique dans `used`.
 * Cœurs d'abord, puis ronds, puis carrés — donc ça « marche toujours ».
 */
export function suggestEmoji(color: number, used: Set<string>): string {
  const rgb = color ? toRgb(color) : WHITE.rgb
  for (const group of GROUPS) {
    const free = group.filter((h) => !used.has(h.emoji))
    if (free.length) return nearest(free, rgb).emoji
  }
  return ''
}
