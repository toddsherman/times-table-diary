import { FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import type { Milestone } from '../types'
import { Crown } from './crowns'
import { CROWN_STAGES, crownStage, gemOf } from './palette'

/** For each crown stage from forged (1) to crown jewels (5): the pop-up's title and text, and the letter's line. */
const LINES: Record<number, { title: (t: number) => string; text: (t: number, gem: string) => string; entry: (t: number, gem: string) => string }> = {
  1: {
    title: (t) => `Your ${t}s crown is forged!`,
    text: (t, gem) => `You found all twelve ${t}s gems: ${gem}! Now polish them.`,
    entry: (t, gem) => `I found every ${gem} for my ${t}s crown, so the royal goldsmith FORGED it!`,
  },
  2: {
    title: (t) => `Half a crown of ${t}s!`,
    text: (t) => `Six of the ${t}s gems are polished. Halfway there!`,
    entry: (t) => `Half the gems on my ${t}s crown are polished. So shiny!`,
  },
  3: {
    title: (t) => `Crowning day: the ${t}s!`,
    text: (t) => `Every ${t}s gem is polished. The whole kingdom cheers!`,
    entry: (t) => `CROWNING DAY! Every gem on my ${t}s crown is polished, and the whole kingdom cheered.`,
  },
  4: {
    title: (t) => `The ${t}s crown sparkles!`,
    text: (t) => `Every ${t}s fact is mastered. What a dazzling crown!`,
    entry: (t) => `My ${t}s crown SPARKLES! I mastered every single ${t}s fact.`,
  },
  5: {
    title: (t) => `Crown jewels: the ${t}s!`,
    text: (t) => `Every ${t}s gem is a crown jewel. Fit for a queen!`,
    entry: (t) => `Every gem on my ${t}s crown is a CROWN JEWEL. Fit for a queen!`,
  },
}

/**
 * Each table's crown at its current stage. Only the current stage is listed, so a crown that goes
 * from forged to crowned in one go is celebrated once, for the crowning.
 */
export function crownMilestones(p: Progress): Milestone[] {
  const out: Milestone[] = []
  for (const t of FACTORS) {
    const stage = crownStage(p, t)
    const lines = LINES[stage]
    if (!lines) continue
    const gem = gemOf(t)
    out.push({
      key: `crown${t}-s${stage}`,
      title: lines.title(t),
      text: lines.text(t, gem.plural),
      entryLine: lines.entry(t, gem.name.toLowerCase()),
      art: <Crown progress={p} table={t} width={170} label={`The ${t}s crown: ${CROWN_STAGES[stage].toLowerCase()}`} />,
    })
  }
  return out
}
