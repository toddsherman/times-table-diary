import { describe, expect, it } from 'vitest'
import { factId, FACTORS } from '../engine/facts'
import { createProgress } from '../engine/progress'
import type { Level } from '../engine/types'
import { THEMES } from '.'

/** The level a wrong answer leaves a fact at (see scoreFirstTry). */
const missed = (level: number): Level => (level >= 3 ? 2 : 1)

describe('milestones', () => {
  for (const theme of THEMES.filter((t) => t.milestones)) {
    it(`${theme.id}: a miss never brings a milestone that looks new`, () => {
      for (let level = 1; level <= 5; level++) {
        const p = createProgress('Sam', 100)
        for (const t of FACTORS) for (const b of FACTORS) p.facts[factId(t, b)].level = level as Level
        const before = new Set(theme.milestones!(p).map((m) => m.key))
        p.facts[factId(7, 8)].level = missed(level)
        p.facts[factId(8, 7)].level = missed(level)
        const fresh = theme.milestones!(p).filter((m) => !before.has(m.key))
        expect(fresh.map((m) => m.key)).toEqual([])
      }
    })

    it(`${theme.id}: keys are unique and stable`, () => {
      const p = createProgress('Sam', 100)
      for (const t of FACTORS) for (const b of FACTORS) p.facts[factId(t, b)].level = 4
      const keys = theme.milestones!(p).map((m) => m.key)
      expect(new Set(keys).size).toBe(keys.length)
      expect(theme.milestones!(p).map((m) => m.key)).toEqual(keys)
    })
  }
})
