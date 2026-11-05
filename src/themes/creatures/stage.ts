import { factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import { tableStage } from '../tables'

/**
 * A table's creature: 0 egg, 1 baby, 2 evolved, 3 final form, 4 shiny. Like tableStage, except an
 * egg only hatches once a fact of its table has really been answered. A new diary starts its ×1 and
 * ×10 facts inked, which tableStage counts as met, and would hatch every egg before the first question.
 */
export function creatureStage(p: Progress, table: number): number {
  const stage = tableStage(p, table)
  if (stage >= 2) return stage
  return FACTORS.some((b) => p.facts[factId(table, b)].seen > 0) ? 1 : 0
}
