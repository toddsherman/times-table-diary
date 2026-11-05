import { describe, expect, it } from 'vitest'
import { parseProgress } from '../storage'
import { addTime, beginPart, endPart, finishPage, LIGHTNING_LAP, pageDone, planDay, plannedMinutes, startToday } from './day'
import { ALL_FACT_IDS, parseFact, stageOf } from './facts'
import { createProgress, withSettings } from './progress'
import { nextQuestion, recordAnswer, startPart, createSession, type Rng } from './session'
import { mergeProgress } from './sync'
import type { DayPlan, PartKind, Progress, Question } from './types'

const TODAY = 20_000

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
const onlyRules: Student = (q) => ({ correct: q.form !== 'times' || stageOf(q.a, q.b) === 1, ms: 1500 })
/** Knows only the rules at first sight, but remembers a fact once a fix-up has shown it. */
const learnsFromFixups: Student = (q) => ({ correct: q.form !== 'times' || q.kind === 'reask' || stageOf(q.a, q.b) === 1, ms: 1500 })

/** Plays the current part to its end, as the practice screen would. Returns what was asked. */
function playPart(p: Progress, plan: DayPlan, student: Student, rng: Rng, msPerQuestion = 6000): Question[] {
  beginPart(p, plan)
  const asked: Question[] = []
  for (let q = nextQuestion(p, plan.session, rng); q; q = nextQuestion(p, plan.session, rng)) {
    asked.push(q)
    const { correct, ms } = student(q)
    recordAnswer(p, plan.session, q, correct, ms)
    addTime(plan, msPerQuestion)
    if (asked.length > 200) throw new Error('part never ended')
  }
  endPart(p, plan, 1000)
  return asked
}

function playDay(p: Progress, student: Student, { day = TODAY, seed = 1 } = {}) {
  const rng = seeded(seed)
  const plan = startToday(p, day, 0, rng)
  const byPart: Partial<Record<PartKind, Question[]>> = {}
  while (!pageDone(plan)) byPart[plan.parts[plan.current].kind] = playPart(p, plan, student, rng)
  const entry = finishPage(p, plan, 'heart', 2000, rng)
  return { plan, byPart, entry }
}

const kinds = (plan: DayPlan) => plan.parts.map((part) => part.kind)

describe('planning the daily page', () => {
  it('lays out five parts that add up to about 20 minutes', () => {
    const p = createProgress('Ava', TODAY)
    const plan = planDay(p, TODAY, 0, seeded(1))
    expect(kinds(plan)).toEqual(['warmup', 'new', 'mixed', 'puzzles', 'lightning'])
    expect(plannedMinutes(p, plan)).toBeGreaterThan(18.5)
    expect(plannedMinutes(p, plan)).toBeLessThan(21)
    expect(plan.parts.at(-1)?.planned).toBe(LIGHTNING_LAP)
  })

  it('sizes the page to the minutes chosen in settings', () => {
    const p = withSettings(createProgress('Ava', TODAY), { dailyMinutes: 10 })
    const minutes = plannedMinutes(p, planDay(p, TODAY, 0, seeded(1)))
    expect(minutes).toBeGreaterThan(9)
    expect(minutes).toBeLessThan(11.5)
  })

  it('plans fewer questions for a slower pace, so the time stays the same', () => {
    const p = createProgress('Ava', TODAY)
    const quick = planDay(p, TODAY, 0, seeded(1))
    p.pace = { warmup: 12_000, new: 18_000, mixed: 14_000, puzzles: 20_000, lightning: 10_000 }
    const slow = planDay(p, TODAY, 0, seeded(1))
    const mixed = (plan: DayPlan) => plan.parts.find((part) => part.kind === 'mixed')!.planned
    expect(mixed(slow)).toBeLessThan(mixed(quick) * 0.6)
    expect(plannedMinutes(p, slow)).toBeGreaterThan(18)
  })

  it('leaves out the new-facts part once there is nothing left to learn', () => {
    const p = createProgress('Ava', TODAY)
    for (const id of ALL_FACT_IDS) Object.assign(p.facts[id], { level: 4, due: TODAY + 5, seen: 3, right: 3, lastDay: TODAY - 2 })
    const plan = planDay(p, TODAY, 0, seeded(1))
    expect(kinds(plan)).toEqual(['warmup', 'mixed', 'puzzles', 'lightning'])
    expect(plannedMinutes(p, plan)).toBeGreaterThan(18)
  })

  it('makes room in the warm-up for a check-up', () => {
    const p = createProgress('Ava', TODAY)
    for (const id of ['2x3', '2x4', '2x5', '2x6', '2x7', '2x8', '2x9', '3x4', '3x5', '3x6'])
      Object.assign(p.facts[id], { level: 4, due: TODAY + 3, seen: 3, right: 3, lastDay: TODAY - 10 })
    const plan = planDay(p, TODAY, 0, seeded(1))
    expect(plan.session.checkup.planned).toBe(10)
    expect(plan.parts[0].planned).toBeGreaterThanOrEqual(13)
  })
})

describe('working through the page', () => {
  it('runs every part to about its planned size and writes one diary page', () => {
    const p = createProgress('Ava', TODAY)
    const { plan, entry } = playDay(p, whiz)
    for (const part of plan.parts) {
      expect(part.done, part.kind).toBe(true)
      if (part.kind !== 'new') expect(part.asked, part.kind).toBeGreaterThanOrEqual(part.planned)
      expect(part.asked, part.kind).toBeLessThanOrEqual(part.planned + 4)
    }
    expect(plan.finished).toBe(true)
    expect(p.entries).toEqual([entry])
    expect(entry.stats.parts).toBe(5)
    expect(entry.lines.join(' ')).toContain('I finished my WHOLE page')
  })

  it('scores each fact once a day, however many parts it comes up in', () => {
    const p = createProgress('Ava', TODAY)
    const { plan } = playDay(p, whiz)
    expect(new Set(plan.session.scored).size).toBe(plan.session.scored.length)
    expect(p.facts['1x1'].seen).toBeLessThanOrEqual(1)
  })

  it('keeps new facts out of the warm-up', () => {
    const p = createProgress('Ava', TODAY)
    const { byPart } = playDay(p, whiz)
    expect(byPart.warmup?.some((q) => q.kind === 'new')).toBe(false)
    expect(byPart.new?.some((q) => q.kind === 'new')).toBe(true)
  })

  it('focuses the new-facts part on new facts', () => {
    const p = createProgress('Ava', TODAY)
    const { byPart } = playDay(p, whiz)
    const firstTries = byPart.new!.filter((q) => q.kind !== 'reask')
    expect(firstTries.filter((q) => q.kind === 'new').length / firstTries.length).toBeGreaterThan(0.5)
  })

  it('stops at a few new facts a day for a struggling learner, and ends that part early', () => {
    const p = createProgress('Ava', TODAY)
    const { plan, byPart } = playDay(p, learnsFromFixups)
    expect(plan.session.newMet.length).toBeLessThanOrEqual(4)
    const part = plan.parts.find((x) => x.kind === 'new')!
    expect(part.asked).toBeLessThan(part.planned)
    // Even for someone who misses every new fact, most of the part is still answered right.
    const missed = byPart.new!.filter((q) => q.kind === 'new' || q.kind === 'learning').length
    expect(missed / byPart.new!.length).toBeLessThan(0.4)
  })

  it("trims practice to facts she hasn't tried yet today, instead of repeating them", () => {
    const p = createProgress('Ava', TODAY)
    const { plan, byPart } = playDay(p, onlyRules)
    const part = plan.parts.find((x) => x.kind === 'mixed')!
    expect(part.planned).toBeLessThan(40)
    expect(byPart.mixed!.filter((q) => q.kind === 'extra').length).toBeLessThanOrEqual(3)
  })

  it('ends the new-facts part early when nothing is left to learn today', () => {
    const p = createProgress('Ava', TODAY)
    for (const id of ALL_FACT_IDS) Object.assign(p.facts[id], { level: 3, due: TODAY + 2 })
    const s = createSession(0, TODAY, 0)
    startPart(s, 'new', 30)
    expect(nextQuestion(p, s, seeded(1))).toBeNull()
  })

  it('asks puzzles that turn known facts around, without moving their doodle levels', () => {
    const p = createProgress('Ava', TODAY)
    const before = structuredClone(p.facts)
    const plan = planDay(p, TODAY, 0, seeded(4))
    plan.current = plan.parts.findIndex((part) => part.kind === 'puzzles')
    const puzzles = playPart(p, plan, (q) => ({ correct: q.a !== 10, ms: 2500 }), seeded(5))
    const forms = new Set(puzzles.map((q) => q.form))
    expect([...forms].sort()).toEqual(['divide', 'missing-a', 'missing-b'])
    for (const q of puzzles) {
      const { a, b } = parseFact(q.id)
      expect(q.answer).toBe(q.form === 'missing-a' ? a : b)
      expect(p.facts[q.id].level).toBeGreaterThanOrEqual(2)
    }
    expect(p.facts).toEqual(before)
    // Missed puzzles come back for another go.
    expect(puzzles.some((q) => q.kind === 'reask' && q.form !== 'times')).toBe(true)
  })

  it('runs a lightning lap of different facts with no fix-up repeats, and keeps the record', () => {
    const p = createProgress('Ava', TODAY)
    const plan = planDay(p, TODAY, 0, seeded(2))
    plan.current = plan.parts.findIndex((part) => part.kind === 'lightning')
    const missOne: Student = (q) => ({ correct: q !== lap[3], ms: 1200 })
    const lap: Question[] = []
    beginPart(p, plan)
    for (let q = nextQuestion(p, plan.session, seeded(3)); q; q = nextQuestion(p, plan.session, seeded(3))) {
      lap.push(q)
      recordAnswer(p, plan.session, q, missOne(q).correct, 1200)
    }
    const part = endPart(p, plan, 1000)
    expect(lap).toHaveLength(LIGHTNING_LAP)
    expect(new Set(lap.map((q) => q.id)).size).toBe(LIGHTNING_LAP)
    expect(lap.every((q) => q.kind === 'lightning' && q.form === 'times')).toBe(true)
    expect(part.fast).toBe(LIGHTNING_LAP - 1)
    expect(p.bestLightning).toBe(LIGHTNING_LAP - 1)
  })

  it('learns her pace from each part', () => {
    const p = createProgress('Ava', TODAY)
    const plan = planDay(p, TODAY, 0, seeded(1))
    playPart(p, plan, whiz, seeded(1), 4000)
    expect(p.pace.warmup).toBe(4000)
    plan.parts[1].activeMs = 0
    playPart(p, plan, whiz, seeded(2), 12_000)
    expect(p.pace.new).toBe(12_000)
  })

  it('picks up where she left off after the app is closed mid-part', () => {
    const p = createProgress('Ava', TODAY)
    const rng = seeded(9)
    const plan = startToday(p, TODAY, 0, rng)
    playPart(p, plan, whiz, rng)
    beginPart(p, plan)
    for (let i = 0; i < 5; i++) {
      const q = nextQuestion(p, plan.session, rng)!
      recordAnswer(p, plan.session, q, true, 1500)
    }
    plan.pending = nextQuestion(p, plan.session, rng)

    const reopened = parseProgress(JSON.stringify(p))
    const again = startToday(reopened, TODAY, 5000, rng)
    expect(again.current).toBe(1)
    expect(again.running).toBe(true)
    expect(again.pending).toEqual(plan.pending)
    expect(again.session.asked).toBe(plan.session.asked)
    expect(again.parts[0].done).toBe(true)
  })

  it('starts a fresh page the next day, and adds a bonus round once the page is done', () => {
    const p = createProgress('Ava', TODAY)
    const { plan } = playDay(p, whiz)
    const bonus = startToday(p, TODAY, 3000)
    expect(bonus).toBe(plan)
    expect(bonus.parts.at(-1)).toMatchObject({ kind: 'bonus', planned: 20, done: false })
    expect(bonus.current).toBe(bonus.parts.length - 1)
    const tomorrow = startToday(p, TODAY + 1, 4000)
    expect(tomorrow.day).toBe(TODAY + 1)
    expect(tomorrow.current).toBe(0)
  })

  it('logs each day for the progress report', () => {
    const p = createProgress('Ava', TODAY)
    const { plan } = playDay(p, whiz)
    expect(p.days).toHaveLength(1)
    const [log] = p.days
    expect(log).toMatchObject({ day: TODAY, parts: 5, done: 5, questions: plan.session.asked })
    expect(log.activeMs).toBe(plan.session.asked * 6000)
    expect(log.puzzles.asked).toBeGreaterThan(0)
    expect(log.lightning).toEqual({ asked: LIGHTNING_LAP, fast: LIGHTNING_LAP })
  })

  it('celebrates a new lightning-lap record in the diary', () => {
    const p = createProgress('Ava', TODAY)
    p.bestLightning = 12
    const { entry } = playDay(p, whiz)
    expect(entry.lines).toContain(`Lightning lap: ${LIGHTNING_LAP} SUPER fast. NEW RECORD!!!`)
  })

  it('takes a few weeks of daily pages to master nearly everything', () => {
    const p = createProgress('Ava', TODAY)
    for (let d = 0; d < 21; d++) playDay(p, whiz, { day: TODAY + d, seed: d + 1 })
    const mastered = Object.values(p.facts).filter((f) => f.level >= 4).length
    expect(mastered).toBeGreaterThanOrEqual(120)
  })
})

describe('syncing the daily page', () => {
  it('keeps the copy of today that got further, and pools the practice log', () => {
    const ipad = createProgress('Ava', TODAY)
    const phone = structuredClone(ipad)
    const yesterday = playDay(ipad, whiz, { day: TODAY - 1 })
    expect(yesterday.plan.finished).toBe(true)
    const rng = seeded(3)
    const plan = startToday(phone, TODAY, 0, rng)
    playPart(phone, plan, whiz, rng)

    const merged = mergeProgress(ipad, phone)
    expect(merged.today?.day).toBe(TODAY)
    expect(merged.days.map((d) => d.day)).toEqual([TODAY - 1, TODAY])
    expect(mergeProgress(phone, ipad).today?.day).toBe(TODAY)

    const further = structuredClone(phone)
    playPart(further, further.today!, whiz, seeded(4))
    expect(mergeProgress(phone, further).today?.current).toBe(2)
    expect(mergeProgress(further, phone).today?.current).toBe(2)
  })
})
