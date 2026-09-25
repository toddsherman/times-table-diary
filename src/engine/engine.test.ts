import { describe, expect, it } from 'vitest'
import { writeEntry } from './diary'
import { ALL_FACT_IDS, familyOf, INTRO_ORDER, parseFact, stageOf, strategyHint } from './facts'
import { createProgress, fastThreshold, levelCounts, masteredCount, scoreFirstTry, streak } from './progress'
import { createSession, finishCheckup, MAX_LEARNING, nextQuestion, planCheckup, recordAnswer, type Rng } from './session'
import type { FactStat, Level, Progress, Question } from './types'

const TODAY = 20_000

/** mulberry32: a tiny seeded random generator so sessions are repeatable. */
function seeded(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

type Student = (q: Question) => { correct: boolean; ms: number }

const whiz: Student = () => ({ correct: true, ms: 1500 })
/** Knows the ×1 and ×10 rules instantly, misses everything else. */
const onlyRules: Student = (q) => ({ correct: stageOf(q.a, q.b) === 1, ms: 1500 })

function runSession(p: Progress, student: Student, { day = TODAY, length = 20, seed = 1 } = {}) {
  const rng = seeded(seed)
  const s = createSession(length, day, 0)
  const asked: Question[] = []
  for (let q = nextQuestion(p, s, rng); q; q = nextQuestion(p, s, rng)) {
    asked.push(q)
    const { correct, ms } = student(q)
    recordAnswer(p, s, q, correct, ms)
    if (asked.length > 100) throw new Error('session never ended')
  }
  return { s, asked }
}

describe('facts', () => {
  it('covers every fact from 1 × 1 to 12 × 12 exactly once', () => {
    expect(ALL_FACT_IDS).toHaveLength(144)
    expect(INTRO_ORDER).toHaveLength(144)
    expect(new Set(INTRO_ORDER)).toEqual(new Set(ALL_FACT_IDS))
  })

  it('sorts facts into strategy stages', () => {
    const counts = [0, 0, 0, 0, 0]
    for (const id of ALL_FACT_IDS) {
      const { a, b } = parseFact(id)
      counts[stageOf(a, b) - 1] += 1
    }
    expect(counts).toEqual([44, 36, 28, 27, 9])
  })

  it('teaches stage by stage with turnarounds side by side', () => {
    const stages = INTRO_ORDER.map((id) => stageOf(parseFact(id).a, parseFact(id).b))
    expect(stages).toEqual([...stages].sort((x, y) => x - y))
    expect(INTRO_ORDER[INTRO_ORDER.indexOf('2x7') + 1]).toBe('7x2')
  })

  it('gives every fact a hint that ends with the right answer', () => {
    for (const id of ALL_FACT_IDS) {
      const { a, b, answer } = parseFact(id)
      const numbers = strategyHint(a, b).match(/\d+/g) ?? []
      expect(Number(numbers.at(-1)), id).toBe(answer)
    }
  })
})

describe('scheduling', () => {
  const stat = (level: Level, due = TODAY): FactStat => ({ level, due, seen: 0, right: 0, times: [], lastDay: -1 })

  it('colors in a new fact she already knows', () => {
    const s = stat(0)
    scoreFirstTry(s, 'fast', 1500, TODAY)
    expect([s.level, s.due]).toEqual([3, TODAY + 3])
  })

  it('keeps slow or missed new facts in pencil, due again today', () => {
    const slow = stat(0)
    scoreFirstTry(slow, 'slow', 6000, TODAY)
    expect([slow.level, slow.due]).toEqual([1, TODAY])
    const missed = stat(0)
    scoreFirstTry(missed, 'wrong', 2000, TODAY)
    expect([missed.level, missed.due]).toEqual([1, TODAY])
  })

  it('promotes due facts one level at a time with growing gaps', () => {
    const s = stat(1)
    const steps: Array<[number, number]> = []
    let day = TODAY
    for (let i = 0; i < 5; i++) {
      scoreFirstTry(s, 'fast', 1500, day)
      steps.push([s.level, s.due - day])
      day = s.due
    }
    expect(steps).toEqual([[2, 1], [3, 3], [4, 7], [5, 21], [5, 21]])
  })

  it("doesn't promote facts that aren't due yet", () => {
    const s = stat(3, TODAY + 2)
    scoreFirstTry(s, 'fast', 1500, TODAY)
    expect([s.level, s.due]).toEqual([3, TODAY + 2])
  })

  it('drops missed facts back, gently for well-known ones', () => {
    const known = stat(4)
    scoreFirstTry(known, 'wrong', 2000, TODAY)
    expect([known.level, known.due]).toEqual([2, TODAY + 1])
    const shaky = stat(2)
    scoreFirstTry(shaky, 'wrong', 2000, TODAY)
    expect([shaky.level, shaky.due]).toEqual([1, TODAY])
  })

  it('holds slow answers at their level and checks again tomorrow', () => {
    const s = stat(3)
    scoreFirstTry(s, 'slow', 7000, TODAY)
    expect([s.level, s.due]).toEqual([3, TODAY + 1])
  })

  it('tunes the speed goal to how fast she types', () => {
    expect(fastThreshold([], 56)).toBe(3000)
    expect(fastThreshold([900, 1000, 1100, 1000, 1000], 56)).toBe(2800)
    expect(fastThreshold([3000, 3200, 3100, 3000, 3300], 56)).toBe(4900)
    expect(fastThreshold([6000, 6000, 6000, 6000, 6000], 56)).toBe(5000)
    expect(fastThreshold([], 108)).toBe(3400)
  })

  it('counts diary days in a row, forgiving a single skipped day', () => {
    const days = (...ds: number[]) => ds.map((day) => ({ day }))
    expect(streak([], TODAY)).toBe(0)
    expect(streak(days(TODAY), TODAY)).toBe(1)
    expect(streak(days(TODAY - 2, TODAY - 1, TODAY - 1, TODAY), TODAY)).toBe(3)
    expect(streak(days(TODAY - 4, TODAY - 2, TODAY), TODAY)).toBe(3)
    expect(streak(days(TODAY - 5, TODAY - 1), TODAY)).toBe(1)
    expect(streak(days(TODAY - 6, TODAY - 3), TODAY)).toBe(0)
  })
})

describe('sessions', () => {
  it('starts a new diary with the ×1 and ×10 rules inked and everything else blank', () => {
    const p = createProgress('Test', TODAY)
    expect(levelCounts(p)).toEqual([100, 0, 44, 0, 0, 0])
  })

  it('places a whiz quickly while still mixing in reviews', () => {
    const p = createProgress('Test', TODAY)
    const { s, asked } = runSession(p, whiz)
    expect(asked).toHaveLength(20)
    expect(s.placed).toEqual(expect.arrayContaining([2, 5]))
    expect(asked.filter((q) => q.kind === 'review').length).toBeGreaterThanOrEqual(5)
    expect(s.newMet.every((id) => p.facts[id].level === 3)).toBe(true)
  })

  it('inks the rest of a table once she aces its first few facts, due for checking soon', () => {
    const p = createProgress('Test', TODAY)
    runSession(p, whiz)
    for (const id of ['2x12', '12x2', '5x9']) {
      expect(p.facts[id].level, id).toBeGreaterThanOrEqual(2)
      expect(p.facts[id].due, id).toBeLessThanOrEqual(TODAY + 3)
    }
  })

  it("doesn't ink a table after a miss in it", () => {
    const p = createProgress('Test', TODAY)
    const missesTwoThree: Student = (q) => ({ correct: q.id !== '2x3', ms: 1500 })
    const { s } = runSession(p, missesTwoThree)
    expect(s.placed).not.toContain(2)
    expect(p.facts['2x12'].level).toBe(0)
  })

  it('never asks a fact or its turnaround twice in a row', () => {
    for (const student of [whiz, onlyRules]) {
      const p = createProgress('Test', TODAY)
      const { asked } = runSession(p, student, { length: 30 })
      for (let i = 1; i < asked.length; i++) {
        expect(familyOf(asked[i].id), `question ${i + 1}`).not.toBe(familyOf(asked[i - 1].id))
      }
    }
  })

  it('brings a missed fact back two questions later, then again later on', () => {
    const p = createProgress('Test', TODAY)
    const missFirstTry: Student = (q) => ({ correct: !(q.id === '2x2' && q.kind !== 'reask'), ms: 1500 })
    const { s, asked } = runSession(p, missFirstTry)
    const first = asked.findIndex((q) => q.id === '2x2')
    expect(asked[first].kind).toBe('new')
    expect(asked[first + 3]).toMatchObject({ id: '2x2', kind: 'reask' })
    expect(asked.filter((q) => q.id === '2x2' && q.kind === 'reask')).toHaveLength(2)
    expect(s.fixed).toEqual(['2x2'])
    expect(p.facts['2x2'].level).toBe(1)
  })

  it('adds only a few new facts at a time for a struggling learner', () => {
    const p = createProgress('Test', TODAY)
    const first = runSession(p, onlyRules)
    expect(first.s.newMet.length).toBeLessThanOrEqual(4)
    for (let d = 1; d < 8; d++) runSession(p, onlyRules, { day: TODAY + d, seed: d })
    expect(levelCounts(p)[1]).toBeLessThanOrEqual(MAX_LEARNING)
  })

  it('pauses new facts once she is learning a full hand of them', () => {
    const p = createProgress('Test', TODAY)
    const slowButRight: Student = (q) => ({ correct: true, ms: stageOf(q.a, q.b) === 1 ? 1500 : 8000 })
    for (let d = 0; d < 6; d++) runSession(p, slowButRight, { day: TODAY + d, length: 60, seed: d + 1 })
    expect(levelCounts(p)[1]).toBe(MAX_LEARNING)
    const { s } = runSession(p, slowButRight, { day: TODAY + 6, length: 60 })
    expect(s.newMet).toEqual([])
  })

  it('keeps most questions easy for a struggling learner and ends on time', () => {
    const p = createProgress('Test', TODAY)
    const { asked } = runSession(p, onlyRules, { length: 30 })
    const firstTries = asked.filter((q) => q.kind !== 'reask')
    const hard = firstTries.filter((q) => q.kind === 'new' || q.kind === 'learning')
    expect(hard.length / firstTries.length).toBeLessThanOrEqual(0.4)
    expect(asked.length).toBeLessThanOrEqual(34)
  })

  it('scores each fact once per session', () => {
    const p = createProgress('Test', TODAY)
    const { asked } = runSession(p, whiz, { length: 30 })
    const firstTries = asked.filter((q) => q.kind !== 'reask').map((q) => q.id)
    expect(new Set(firstTries).size).toBe(firstTries.length)
  })

  it('gets a whiz to mastery of everything within a few weeks of daily practice', () => {
    const p = createProgress('Test', TODAY)
    for (let d = 0; d < 28; d++) runSession(p, whiz, { day: TODAY + d, seed: d + 1 })
    expect(levelCounts(p)[0]).toBe(0)
    expect(masteredCount(p)).toBeGreaterThanOrEqual(120)
  })
})

describe('diary', () => {
  it('writes an entry from the session', () => {
    const p = createProgress('Test', TODAY)
    const { s } = runSession(p, whiz)
    const entry = writeEntry(s, { streakDays: 3, sticker: 'heart', now: 5 * 60_000, mastered: 7 }, seeded(7))
    expect(entry.stats).toEqual({ total: 20, firstTry: 20, right: 20, fast: 20, minutes: 5, mastered: 7 })
    expect(entry.lines).toContain('I did 20 times table facts in 5 minutes, and 20 were SUPER fast.')
    expect(entry.lines.join(' ')).toContain('3 diary days in a row')
  })
})

describe('check-ups', () => {
  const master = (p: Progress, ids: string[], lastDay: number) => {
    for (const id of ids) Object.assign(p.facts[id], { level: 4, lastDay, due: lastDay + 7, seen: 3, right: 3 })
  }

  it('waits until enough mastered facts have gone a week without practice', () => {
    const p = createProgress('Test', TODAY)
    master(p, ['2x3', '3x2', '2x4', '4x2'], TODAY - 10)
    expect(planCheckup(p, TODAY)).toEqual([])
    master(p, ['2x5', '2x6', '2x7', '2x8', '2x9'], TODAY - 10)
    const plan = planCheckup(p, TODAY, seeded(3))
    expect(plan).toHaveLength(7)
    expect(new Set(plan.map(familyOf)).size).toBe(plan.length)
  })

  it("doesn't re-test facts she practiced this week", () => {
    const p = createProgress('Test', TODAY)
    master(p, ['2x3', '2x4', '2x5', '2x6', '2x7', '2x8'], TODAY - 2)
    expect(planCheckup(p, TODAY)).toEqual([])
  })

  it('asks the check-up first, records the score, then waits two weeks', () => {
    const p = createProgress('Test', TODAY)
    master(p, ['2x3', '2x4', '2x5', '2x6', '2x7', '2x8', '2x9'], TODAY - 10)
    const plan = planCheckup(p, TODAY, seeded(1))
    const s = createSession(20, TODAY, 0, plan)
    const rng = seeded(2)
    const asked: Question[] = []
    for (let q = nextQuestion(p, s, rng); q; q = nextQuestion(p, s, rng)) {
      asked.push(q)
      recordAnswer(p, s, q, q.id !== plan[0], 1500)
    }
    const lastCheckup = asked.map((q) => q.kind).lastIndexOf('checkup')
    expect(asked.slice(0, lastCheckup + 1).every((q) => q.kind === 'checkup' || q.kind === 'reask')).toBe(true)
    expect(new Set(asked.filter((q) => q.kind === 'checkup').map((q) => q.id))).toEqual(new Set(plan))

    finishCheckup(p, s, 123)
    expect(p.checkups).toEqual([{ at: 123, day: TODAY, asked: 7, right: 6, fast: 6 }])
    expect(planCheckup(p, TODAY + 13)).toEqual([])
  })

  it("doesn't record a check-up that was cut short", () => {
    const p = createProgress('Test', TODAY)
    const s = createSession(20, TODAY, 0, ['2x3', '2x4'])
    const q = nextQuestion(p, s, seeded(1))!
    recordAnswer(p, s, q, true, 1500)
    finishCheckup(p, s, 123)
    expect(p.checkups).toEqual([])
    expect(p.lastCheckupDay).toBe(-1)
  })
})
