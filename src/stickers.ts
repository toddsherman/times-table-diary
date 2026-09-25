export const STICKER_IDS = [
  'heart',
  'star',
  'crown',
  'bolt',
  'cupcake',
  'rainbow',
  'notes',
  'icecream',
  'flower',
  'cool',
  'cat',
  'balloon',
] as const

export type StickerId = (typeof STICKER_IDS)[number]

export const STICKER_NAMES: Record<StickerId, string> = {
  heart: 'Heart',
  star: 'Happy star',
  crown: 'Crown',
  bolt: 'Lightning bolt',
  cupcake: 'Cupcake',
  rainbow: 'Rainbow',
  notes: 'Music notes',
  icecream: 'Ice cream',
  flower: 'Flower',
  cool: 'Cool face',
  cat: 'Kitty',
  balloon: 'Balloon',
}

/** One sticker per diary entry: a new one until she has them all, then repeats. */
export function awardSticker(collected: readonly string[], rng: () => number = Math.random): StickerId {
  const missing = STICKER_IDS.filter((id) => !collected.includes(id))
  const pool = missing.length > 0 ? missing : [...STICKER_IDS]
  return pool[Math.floor(rng() * pool.length)]
}
