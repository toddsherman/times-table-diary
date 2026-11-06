import { FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import type { Milestone } from '../types'
import { Pennant } from './court'
import { tableLevel } from './palette'

/** For each milestone from 1 (on the team) to 5 (hall of fame): the pop-up's words and the entry's line. */
const LINES: Record<number, { title: (t: number) => string; text: (t: number) => string; entry: (t: number) => string }> = {
  1: {
    title: (t) => `You made the ${t}s team!`,
    text: (t) => `You've met every ${t}s fact. Welcome to the team!`,
    entry: (t) => `I made the ${t}s TEAM! I've met every single ${t}s fact.`,
  },
  2: {
    title: (t) => `Halftime in the ${t}s!`,
    text: (t) => `Half of your ${t}s shots are layups or better. Keep shooting!`,
    entry: (t) => `Halftime in the ${t}s: half of my ${t}s shots are going in!`,
  },
  3: {
    title: (t) => `You won the ${t}s game!`,
    text: (t) => `Every ${t}s fact is a layup or better. What a win!`,
    entry: (t) => `I WON THE ${t}s GAME! Every single ${t}s shot went in.`,
  },
  4: {
    title: (t) => `${t}s banner raised!`,
    text: (t) => `Every ${t}s fact is a swish. Your banner goes up in the rafters!`,
    entry: (t) => `My ${t}s banner went up in the rafters!!! Every ${t}s fact is a swish.`,
  },
  5: {
    title: (t) => `Hall of fame: the ${t}s!`,
    text: (t) => `Every ${t}s fact is a slam dunk. Legendary!`,
    entry: (t) => `HALL OF FAME! Every one of my ${t}s is a slam dunk.`,
  },
}

/**
 * Each table's current milestone. Only the current one is listed, so a table that goes straight
 * from nothing to halftime in one go is celebrated once, for halftime.
 */
export function milestones(p: Progress): Milestone[] {
  const out: Milestone[] = []
  for (const t of FACTORS) {
    const level = tableLevel(p, t)
    const lines = LINES[level]
    if (!lines) continue
    out.push({
      key: `t${t}-m${level}`,
      title: lines.title(t),
      text: lines.text(t),
      entryLine: lines.entry(t),
      art: <Pennant level={level} table={t} width={110} />,
    })
  }
  return out
}
