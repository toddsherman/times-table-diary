import { factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import type { StickerId } from '../../stickers'

/** The 12 prizes for the trophy case, by the shared reward slot. The basketball is the picker tile's picture. */
export const REWARD_NAMES: Record<StickerId, string> = {
  star: 'Basketball',
  heart: 'High-top sneakers',
  crown: 'Trophy',
  bolt: "Coach's whistle",
  cupcake: 'Water bottle',
  rainbow: 'Hoop and net',
  notes: 'Scoreboard',
  icecream: 'Foam finger',
  flower: 'Team jersey',
  cool: 'Gold medal',
  cat: 'Team mascot',
  balloon: 'Playbook',
}

/** Colors shared by every drawing in the basketball theme: team navy and orange, maple, scoreboard amber. */
export const C = {
  navy: '#1b2a4e',
  navySoft: '#4a5672',
  royal: '#2457b3',
  ball: '#f0842a',
  ballDark: '#c95e12',
  ballLight: '#f9a65a',
  layup: '#f5913f',
  orange: '#e8590c',
  maple: '#e8c38f',
  mapleLight: '#f4dcb2',
  mapleDark: '#c79a5f',
  white: '#ffffff',
  amber: '#ffb627',
  board: '#171a22',
  gold: '#ffd23b',
  goldDark: '#d99a0b',
  red: '#d7263d',
  steel: '#c5ccd6',
} as const

export const line = { stroke: C.navy, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
export const thin = { stroke: C.navy, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** How a fact's spot is drawn at each level, on the shot charts (the grid page uses the same colors). */
export const SPOT = [
  { fill: 'rgba(255, 255, 255, 0.45)', stroke: '#a9824f', text: '#86643a', dash: '2.4 2', width: 1.4 },
  { fill: '#ffffff', stroke: '#7d8aa6', text: '#4a5672', dash: '2.4 2', width: 1.6 },
  { fill: '#ffffff', stroke: C.orange, text: C.navy, dash: undefined, width: 2.4 },
  { fill: C.layup, stroke: C.navy, text: C.navy, dash: undefined, width: 1.8 },
  { fill: C.royal, stroke: C.navy, text: '#ffffff', dash: undefined, width: 1.8 },
  { fill: C.gold, stroke: C.navy, text: C.navy, dash: undefined, width: 1.8 },
] as const

/**
 * A table's milestone, 0 to 5: 1 on the team (every fact met), 2 halftime (half at layup or better),
 * 3 game won (all at layup or better), 4 banner (all at swish), 5 hall of fame (all slam dunks).
 */
export function tableLevel(p: Progress, table: number): number {
  const levels = FACTORS.map((b) => p.facts[factId(table, b)].level)
  const atLeast = (l: number) => levels.filter((x) => x >= l).length
  if (atLeast(5) === 12) return 5
  if (atLeast(4) === 12) return 4
  if (atLeast(3) === 12) return 3
  if (atLeast(3) >= 6) return 2
  if (atLeast(1) === 12) return 1
  return 0
}

/** The table's next milestone, as "Win: 11 of 12 layups", and how close it is (0 to 1). */
export function nextStep(p: Progress, table: number, level: number): { text: string; done: number } {
  const levels = FACTORS.map((b) => p.facts[factId(table, b)].level)
  const atLeast = (l: number) => levels.filter((x) => x >= l).length
  const step = (goal: string, have: number, of: number, unit: string) => ({
    text: `${goal}: ${Math.min(have, of)} of ${of} ${unit}`,
    done: Math.min(1, have / of),
  })
  switch (level) {
    case 0:
      // Halftime can come before every fact is met, so show whichever is closer.
      return atLeast(3) / 6 > atLeast(1) / 12 ? step('Halftime', atLeast(3), 6, 'layups') : step('Make the team', atLeast(1), 12, 'met')
    case 1:
      return step('Halftime', atLeast(3), 6, 'layups')
    case 2:
      return step('Win', atLeast(3), 12, 'layups')
    case 3:
      return step('Banner', atLeast(4), 12, 'swishes')
    case 4:
      return step('Hall of fame', atLeast(5), 12, 'slam dunks')
    default:
      return { text: 'Hall of famer!', done: 1 }
  }
}

export const MILESTONE_NAMES = ['Tryouts', 'On the team', 'Halftime', 'Game won', 'Champs', 'Hall of fame'] as const
