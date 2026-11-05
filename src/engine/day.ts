import { writeEntry } from './diary'
import type { Voice } from './voice'
import { masteredCount, streak } from './progress'
import { createSession, finishCheckup, hasLearningWork, lightningPool, partAsked, planCheckup, practiceRoom, puzzlePool, startPart, type Rng } from './session'
import type { DayLog, DayPlan, DiaryEntry, PartKind, PartPlan, Progress, Question } from './types'

/**
 * The daily page: a few short parts that add up to about `dailyMinutes` of practice.
 * Each part is a number of questions, sized from how long questions take her, so the
 * work fits the time without a clock on screen.
 */
export const PARTS: Record<PartKind, { title: string; blurb: string; intro: string }> = {
  warmup: {
    title: 'Warm-up',
    blurb: 'Facts you know',
    intro: 'Easy ones first, to get your brain going.',
  },
  new: {
    title: 'New facts',
    blurb: 'Meet some new ones',
    intro: 'New facts get a NEW! stamp. If one is tricky, you get a trick for it.',
  },
  mixed: {
    title: 'Practice',
    blurb: 'A bit of everything',
    intro: 'Old ones, new ones, all mixed up.',
  },
  puzzles: {
    title: 'Puzzles',
    blurb: 'Missing numbers and division',
    intro: 'Find the missing number. 56 ÷ 7 asks: how many 7s make 56?',
  },
  lightning: {
    title: 'Lightning lap',
    blurb: 'How many super fast?',
    intro: 'Facts you know, as fast as you can. Count your super-fast ones!',
  },
  bonus: {
    title: 'Bonus round',
    blurb: 'Extra practice',
    intro: 'Extra practice, just for fun.',
  },
}

/**
 * How long one question takes in each part before her own pace is known: answering plus the
 * cheer or fix-up afterwards (ms). Her first diary entries averaged about 5 to 10 seconds.
 */
export const DEFAULT_PACE: Record<PartKind, number> = { warmup: 6000, new: 9000, mixed: 7000, puzzles: 10_000, lightning: 5000, bonus: 7000 }

/** How the page's time is shared between parts, after the lightning lap's fixed size. */
const WEIGHTS: Record<'warmup' | 'new' | 'mixed' | 'puzzles', number> = { warmup: 3, new: 5, mixed: 5, puzzles: 5 }
/** Questions in a lightning lap. Fixed, so laps on different days compare fairly. */
export const LIGHTNING_LAP = 20
const MIN_LIGHTNING = 8
const MIN_PUZZLE_POOL = 4
/** Size limits for any one part. */
const MIN_PART = 8
const MAX_PART = 80
/** Longest any one question counts toward practice time, so a break mid-question doesn't. */
export const MAX_QUESTION_MS = 40_000

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export const paceOf = (p: Progress, kind: PartKind): number => p.pace[kind] ?? DEFAULT_PACE[kind]

const newPart = (kind: PartKind, planned: number): PartPlan => ({
  kind,
  planned,
  done: false,
  asked: 0,
  firstTry: 0,
  right: 0,
  fast: 0,
  activeMs: 0,
})

/** Lays out today's page, sized to the daily minutes at her own pace. */
export function planDay(p: Progress, today: number, now: number, rng: Rng = Math.random): DayPlan {
  const checkup = planCheckup(p, today, rng)
  const count = (kind: PartKind, ms: number) => Math.round(ms / paceOf(p, kind))

  const lightningFacts = lightningPool(p).length
  const lightning = lightningFacts >= MIN_LIGHTNING ? Math.min(LIGHTNING_LAP, lightningFacts) : 0
  const rest = Math.max(0, p.settings.dailyMinutes * 60_000 - lightning * paceOf(p, 'lightning'))

  const hasNew = hasLearningWork(p)
  const hasPuzzles = puzzlePool(p).length >= MIN_PUZZLE_POOL
  const weights = { ...WEIGHTS, new: hasNew ? WEIGHTS.new : 0, puzzles: hasPuzzles ? WEIGHTS.puzzles : 0 }
  const total = weights.warmup + weights.new + weights.mixed + weights.puzzles
  const share = (kind: keyof typeof WEIGHTS) => (rest * weights[kind]) / total

  // The warm-up covers what's due plus a few easy ones, and always fits the check-up.
  // Time it doesn't need goes to practice.
  const due = Object.values(p.facts).filter((f) => f.level >= 2 && f.due <= today).length
  const warmup = clamp(Math.min(count('warmup', share('warmup')), Math.max(10, due + 5)), checkup.length + 3, MAX_PART)
  const spare = share('warmup') - warmup * paceOf(p, 'warmup')

  const parts = [newPart('warmup', warmup)]
  if (hasNew) parts.push(newPart('new', clamp(count('new', share('new')), MIN_PART, MAX_PART)))
  parts.push(newPart('mixed', clamp(count('mixed', share('mixed') + spare), MIN_PART, MAX_PART)))
  if (hasPuzzles) parts.push(newPart('puzzles', clamp(count('puzzles', share('puzzles')), MIN_PART, MAX_PART)))
  if (lightning > 0) parts.push(newPart('lightning', lightning))

  return {
    day: today,
    minutes: p.settings.dailyMinutes,
    parts,
    current: 0,
    running: false,
    session: createSession(0, today, now, checkup),
    pending: null,
    activeMs: 0,
    finished: false,
    bestBefore: p.bestLightning,
  }
}

/** Minutes the plan is expected to take at her current pace. */
export function plannedMinutes(p: Progress, plan: DayPlan): number {
  const ms = plan.parts.filter((part) => part.kind !== 'bonus').reduce((sum, part) => sum + part.planned * paceOf(p, part.kind), 0)
  return ms / 60_000
}

/** Today's page, as it stands or as it would be planned now (without saving it). */
export function previewDay(p: Progress, today: number): DayPlan {
  return p.today?.day === today ? p.today : planDay(p, today, Date.now())
}

/**
 * Gets today's page ready to work on: plans it if it's a new day, or adds a bonus
 * round once the page (and any earlier bonus round) is finished.
 */
export function startToday(p: Progress, today: number, now: number, rng: Rng = Math.random): DayPlan {
  if (p.today?.day !== today) p.today = planDay(p, today, now, rng)
  const plan = p.today
  if (plan.current >= plan.parts.length) {
    plan.parts.push(newPart('bonus', p.settings.sessionLength))
    plan.running = false
  }
  return plan
}

/** Shortest a practice part gets trimmed to. */
const MIN_TRIMMED = 5

/**
 * Starts the current part's questions, unless it's already under way. Practice is trimmed to
 * the facts she hasn't tried yet today, so early on (when she knows only a few) it doesn't
 * fill up with repeats.
 */
export function beginPart(p: Progress, plan: DayPlan): void {
  if (plan.running) return
  const part = plan.parts[plan.current]
  if (part.kind === 'mixed') part.planned = Math.max(MIN_TRIMMED, Math.min(part.planned, practiceRoom(p, plan.session)))
  startPart(plan.session, part.kind, part.planned)
  plan.running = true
  plan.pending = null
}

/** Remembers the question on screen, so reopening the app asks it again. */
export function showQuestion(plan: DayPlan, q: Question | null): void {
  plan.pending = q
}

/** Adds the time one question took to today's practice time. */
export function addTime(plan: DayPlan, ms: number): void {
  const t = clamp(ms, 0, MAX_QUESTION_MS)
  plan.activeMs += t
  plan.parts[plan.current].activeMs += t
}

/** Wraps up the current part: saves its results, learns her pace from it, and moves to the next. */
export function endPart(p: Progress, plan: DayPlan, now: number): PartPlan {
  const part = plan.parts[plan.current]
  const s = plan.session
  Object.assign(part, { done: true, asked: partAsked(s), firstTry: s.part.firstTry, right: s.part.right, fast: s.part.fast })
  finishCheckup(p, s, now)
  if (part.asked >= 5) {
    const measured = part.activeMs / part.asked
    const before = p.pace[part.kind]
    p.pace[part.kind] = Math.round(clamp(before === undefined ? measured : before * 0.6 + measured * 0.4, 2000, 30_000))
  }
  if (part.kind === 'lightning') p.bestLightning = Math.max(p.bestLightning, part.fast)
  s.requeue = []
  plan.running = false
  plan.pending = null
  plan.current += 1
  logDay(p, plan)
  return part
}

/** True once every part of the page is done (bonus rounds aren't required). */
export const pageDone = (plan: DayPlan): boolean => plan.parts.every((part) => part.kind === 'bonus' || part.done)

/** Writes the day's diary page (in the theme's voice, if one is given) and awards its sticker. */
export function finishPage(p: Progress, plan: DayPlan, sticker: string, now: number, rng: Rng = Math.random, voice?: Voice): DiaryEntry {
  p.stickers.push(sticker)
  const streakDays = streak([...p.entries, { day: plan.day }], plan.day)
  const entry = writeEntry(
    plan.session,
    {
      streakDays,
      sticker,
      now,
      mastered: masteredCount(p),
      minutes: Math.max(1, Math.round(plan.activeMs / 60_000)),
      page: { parts: plan.parts.filter((part) => part.kind !== 'bonus'), bestBefore: plan.bestBefore },
      events: plan.events,
    },
    rng,
    voice,
  )
  p.entries.push(entry)
  plan.finished = true
  logDay(p, plan)
  return entry
}

/** A part's results so far, including one still under way. */
function resultsOf(plan: DayPlan, i: number): PartPlan {
  const part = plan.parts[i]
  if (!(plan.running && i === plan.current)) return part
  const s = plan.session
  return { ...part, asked: partAsked(s), firstTry: s.part.firstTry, right: s.part.right, fast: s.part.fast }
}

/** Today's line for the progress report. */
export function dayLogOf(plan: DayPlan): DayLog {
  const results = plan.parts.map((_, i) => resultsOf(plan, i))
  const core = results.filter((part) => part.kind !== 'bonus')
  const puzzles = results.filter((part) => part.kind === 'puzzles')
  const lap = results.find((part) => part.kind === 'lightning' && part.firstTry > 0)
  return {
    day: plan.day,
    parts: core.length,
    done: core.filter((part) => part.done).length,
    activeMs: Math.round(plan.activeMs),
    questions: plan.session.asked,
    puzzles: { asked: puzzles.reduce((n, part) => n + part.firstTry, 0), right: puzzles.reduce((n, part) => n + part.right, 0) },
    lightning: lap ? { asked: lap.firstTry, fast: lap.fast } : null,
  }
}

/** Updates today's line in the practice log. */
export function logDay(p: Progress, plan: DayPlan): void {
  const line = dayLogOf(plan)
  p.days = [...p.days.filter((d) => d.day !== line.day), line].sort((x, y) => x.day - y.day)
}
