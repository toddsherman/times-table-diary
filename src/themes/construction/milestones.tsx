import { FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import { tableStage } from '../tables'
import type { Milestone } from '../types'
import { MiniTower } from './tower'

/** A floor is built when all its windows are (every fact colored in), and lit when all are mastered. */
export function milestones(p: Progress): Milestone[] {
  return FACTORS.flatMap((n) => {
    const stage = tableStage(p, n)
    const out: Milestone[] = []
    if (stage >= 3) {
      out.push({
        key: `floor-${n}-built`,
        title: `Floor ${n} is built!`,
        text: `All twelve ${n}s windows are in. Nice work, crew!`,
        entryLine: `FLOOR ${n} IS BUILT! All twelve ${n}s facts are in. Ka-chunk!`,
        art: <MiniTower progress={p} highlight={n} />,
      })
    }
    if (stage >= 4) {
      out.push({
        key: `floor-${n}-lit`,
        title: `Lights on, floor ${n}!`,
        text: `Every ${n}s fact is mastered. The whole floor is glowing!`,
        entryLine: `Every light is on on floor ${n}: all my ${n}s are mastered!`,
        art: <MiniTower progress={p} highlight={n} />,
      })
    }
    return out
  })
}
