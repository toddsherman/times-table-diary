import type { Progress } from '../../engine/types'
import type { Milestone } from '../types'
import { CreatureArt } from './art'
import { LINES, type CreatureLine } from './lines'
import { creatureStage } from './stage'

function milestoneFor(line: CreatureLine, stage: number): Milestone {
  const t = line.table
  const [baby, evolved, final] = line.names
  const art = <CreatureArt table={t} stage={stage} fit />
  switch (stage) {
    case 1:
      return {
        key: `t${t}-s1`,
        title: 'An egg hatched!',
        text: `Say hi to ${baby}, your ×${t} creature!`,
        entryLine: `An egg hatched! Say hi to ${baby}, my new ×${t} creature!`,
        art,
      }
    case 2:
      return {
        key: `t${t}-s2`,
        title: `Whoa! ${baby} evolved!`,
        text: `${baby} grew into ${evolved}! Half of the ×${t} facts are befriended.`,
        entryLine: `${baby} evolved into ${evolved}! WOW!`,
        art,
      }
    case 3:
      return {
        key: `t${t}-s3`,
        title: `${evolved} evolved again!`,
        text: `Meet ${final}, all grown up! Every ×${t} fact is befriended.`,
        entryLine: `${evolved} evolved into ${final}. All grown up!`,
        art,
      }
    default:
      return {
        key: `t${t}-s4`,
        title: `${final} is SHINY!`,
        text: `Every ×${t} fact is mastered, so ${final} sparkles now!`,
        entryLine: `My ${final} turned SHINY. Every ×${t} fact is mastered!`,
        art,
      }
  }
}

/** Every hatch, evolution and shine reached so far, one per table per stage. */
export function milestones(p: Progress): Milestone[] {
  const out: Milestone[] = []
  for (const line of LINES) {
    const stage = creatureStage(p, line.table)
    for (let s = 1; s <= stage; s++) out.push(milestoneFor(line, s))
  }
  return out
}
