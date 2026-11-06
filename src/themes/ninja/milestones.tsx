import { FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import type { Milestone } from '../types'
import { BeltArt } from './belts'
import { BELTS, tableBelt } from './palette'

/** For each belt from white (1) to gold (5): the dialog's line and the entry's line. */
const LINES: Record<number, { text: (t: number) => string; entry: (t: number) => string }> = {
  1: {
    text: (t) => `You've met every ${t}s fact. Your training has begun!`,
    entry: (t) => `I earned my WHITE BELT in the ${t}s! Every journey starts with one step.`,
  },
  2: {
    text: (t) => `Every ${t}s fact is at orange belt or higher.`,
    entry: (t) => `I earned my ORANGE BELT in the ${t}s! Getting stronger.`,
  },
  3: {
    text: (t) => `Every ${t}s fact is at green belt or higher. You've got them all!`,
    entry: (t) => `I earned my GREEN BELT in the ${t}s! I've got them all.`,
  },
  4: {
    text: (t) => `Every ${t}s fact is mastered. What focus!`,
    entry: (t) => `I earned my BLACK BELT in the ${t}s!!! Sensei would be proud.`,
  },
  5: {
    text: (t) => `Every ${t}s fact is gold. Grand master of the ${t}s!`,
    entry: (t) => `GOLD BELT in the ${t}s! I am a true grand master.`,
  },
}

/**
 * Every belt each table has, up to its current one. Lower belts stay listed so a miss that drops a
 * table back doesn't celebrate the lower belt as new; a table that jumps from no belt to orange in
 * one go is celebrated once, for orange (they share a group).
 */
export function beltMilestones(p: Progress): Milestone[] {
  const out: Milestone[] = []
  for (const t of FACTORS) {
    const top = tableBelt(p, t)
    for (let b = 1; b <= top; b++) {
      const lines = LINES[b]
      out.push({
        key: `t${t}-b${b}`,
        group: `t${t}`,
        title: `${BELTS[b].name} in the ${t}s!`,
        text: lines.text(t),
        entryLine: lines.entry(t),
        art: <BeltArt level={b} label={String(t)} />,
      })
    }
  }
  return out
}
