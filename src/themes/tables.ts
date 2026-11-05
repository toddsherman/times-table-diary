import { factId, FACTORS } from '../engine/facts'
import type { Progress } from '../engine/types'
import type { TableStage } from './types'

/** How many of a table's 12 facts are colored in (level 3) or better. */
export const tableColoredIn = (p: Progress, table: number): number =>
  FACTORS.filter((b) => p.facts[factId(table, b)].level >= 3).length

/**
 * A table's overall progress, for themes that show one thing per table (a creature, a belt, a floor):
 * 0 not started, 1 met (any fact past blank), 2 half colored in, 3 all colored in, 4 all mastered.
 */
export function tableStage(p: Progress, table: number): TableStage {
  const levels = FACTORS.map((b) => p.facts[factId(table, b)].level)
  if (levels.every((l) => l >= 4)) return 4
  if (levels.every((l) => l >= 3)) return 3
  if (levels.filter((l) => l >= 3).length >= 6) return 2
  if (levels.some((l) => l >= 1)) return 1
  return 0
}
