import { factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import type { StickerId } from '../../stickers'

export const INK = '#1c1b2e'
export const CRIMSON = '#c8102e'
export const GOLD = '#e8b443'

/**
 * Belts, from none to gold. A fact's belt is its level; a table's belt is the lowest belt among
 * its 12 facts, so "black belt in the 7s" means every 7s fact is at black belt or better.
 */
export const BELTS = [
  { name: 'No belt', color: 'none' },
  { name: 'White belt', color: '#fbf8f0' },
  { name: 'Orange belt', color: '#f39a3b' },
  { name: 'Green belt', color: '#4fae6e' },
  { name: 'Black belt', color: INK },
  { name: 'Gold belt', color: GOLD },
] as const

/** The table's belt: the lowest level among its facts (0 to 5). */
export const tableBelt = (p: Progress, table: number): number => Math.min(...FACTORS.map((b) => p.facts[factId(table, b)].level))

/** How many of the table's facts are at `level` or better. */
export const atLeast = (p: Progress, table: number, level: number): number =>
  FACTORS.filter((b) => p.facts[factId(table, b)].level >= level).length

export const REWARD_NAMES: Record<StickerId, string> = {
  star: 'Ninja mask',
  heart: 'Koi fish',
  crown: 'Temple bell',
  bolt: 'Dragon kite',
  cupcake: 'Rice ball',
  rainbow: 'Snowy mountain',
  notes: 'Taiko drum',
  icecream: 'Paper lantern',
  flower: 'Cherry blossom',
  cool: 'Bonsai tree',
  cat: 'Lucky cat',
  balloon: 'Paper fan',
}
