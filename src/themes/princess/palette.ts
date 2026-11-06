import { factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import type { StickerId } from '../../stickers'

/** Colors shared by every drawing in the princess theme. */
export const P = {
  ink: '#3b1f5c',
  inkSoft: '#6b5487',
  purple: '#6a3fb0',
  lavender: '#e7dbff',
  lilac: '#c7b0f2',
  rose: '#e5427f',
  blush: '#ffd3e4',
  gold: '#f4c34d',
  goldDark: '#c98f1c',
  goldLight: '#ffe7a3',
  cream: '#fff9ee',
  parchment: '#fbf0dc',
  stone: '#aea5be',
  stoneDark: '#857b98',
  leaf: '#3f9a5c',
  sky: '#bfe3ff',
  white: '#ffffff',
} as const

export const line = { stroke: P.ink, strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
export const thin = { stroke: P.ink, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** Each times table's crown has its own gem: the 1s are rubies, the 7s sapphires, and so on. */
export const GEMS: ReadonlyArray<{ name: string; plural: string; color: string; light: string; dark: string }> = [
  { name: 'Ruby', plural: 'rubies', color: '#e8384f', light: '#ffc2cb', dark: '#a3172e' },
  { name: 'Topaz', plural: 'topazes', color: '#f5832a', light: '#ffd3ad', dark: '#b65410' },
  { name: 'Peridot', plural: 'peridots', color: '#7fbf2e', light: '#d9f2b5', dark: '#4f7f12' },
  { name: 'Emerald', plural: 'emeralds', color: '#1e9e5a', light: '#b6ecd0', dark: '#0f6b3a' },
  { name: 'Turquoise', plural: 'turquoises', color: '#17a8a0', light: '#b3ece8', dark: '#0b706b' },
  { name: 'Aquamarine', plural: 'aquamarines', color: '#35b2e3', light: '#c3eafb', dark: '#13799f' },
  { name: 'Sapphire', plural: 'sapphires', color: '#2d5fd3', light: '#c4d4fa', dark: '#183c96' },
  { name: 'Tanzanite', plural: 'tanzanites', color: '#5a4fcf', light: '#d2cdfa', dark: '#3a2f99' },
  { name: 'Amethyst', plural: 'amethysts', color: '#9348d6', light: '#e3cbfa', dark: '#62249c' },
  { name: 'Tourmaline', plural: 'tourmalines', color: '#d63fa8', light: '#f8c6ea', dark: '#991b74' },
  { name: 'Rose quartz', plural: 'rose quartzes', color: '#f27fb8', light: '#ffd6eb', dark: '#b8407c' },
  { name: 'Garnet', plural: 'garnets', color: '#a8224f', light: '#f0bccd', dark: '#6e0f30' },
]

/** The gem of the `table` times table (1 to 12). */
export const gemOf = (table: number) => GEMS[table - 1]

/**
 * A crown's progress: 0 not forged yet (some gems still hidden), 1 forged (every gem found),
 * 2 half the gems polished, 3 crowned (every gem polished), 4 sparkling (every fact mastered),
 * 5 crown jewels (every gem at the top level).
 */
export type CrownStage = 0 | 1 | 2 | 3 | 4 | 5

export function crownStage(p: Progress, table: number): CrownStage {
  const levels = FACTORS.map((b) => p.facts[factId(table, b)].level)
  if (levels.some((l) => l < 1)) return 0
  if (levels.every((l) => l >= 5)) return 5
  if (levels.every((l) => l >= 4)) return 4
  if (levels.every((l) => l >= 3)) return 3
  if (levels.filter((l) => l >= 3).length >= 6) return 2
  return 1
}

/** How many of the table's gems are at `level` or better. */
export const gemsAt = (p: Progress, table: number, level: number): number =>
  FACTORS.filter((b) => p.facts[factId(table, b)].level >= level).length

export const CROWN_STAGES = ['Not forged yet', 'Forged', 'Halfway', 'Crowned', 'Sparkling', 'Crown jewels'] as const

export const REWARD_NAMES: Record<StickerId, string> = {
  star: 'Tiara',
  heart: 'Castle',
  crown: 'Throne',
  bolt: 'Pet dragon',
  cupcake: 'Royal cake',
  rainbow: 'Unicorn',
  notes: 'Telescope',
  icecream: 'Carriage',
  flower: 'Rose garden',
  cool: 'Shield',
  cat: 'Swan',
  balloon: 'Magic wand',
}
