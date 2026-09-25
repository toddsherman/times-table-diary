import { familyOf, helperOf, INTRO_ORDER, parseFact, stageOf } from './facts'
import { classify, fastThreshold, MASTERED, scoreFirstTry } from './progress'
import type { Outcome, Progress, Question, QuestionKind } from './types'

/** Most facts she can be actively learning (pencil level) before new facts pause. */
export const MAX_LEARNING = 8
/** A fact's turnaround family won't repeat within this many questions. */
const RECENT_FAMILIES = 2
/** Extra questions allowed past the session length to finish pending fix-ups. */
const MAX_OVERTIME = 4
const MAX_REASKS = 3
/** Fast first answers from a table, with no misses, before the rest of the table gets inked. */
const PLACEMENT_RUN = 4
/** Days between retention check-ups. */
export const CHECKUP_EVERY = 14
const CHECKUP_SIZE = 10
const CHECKUP_MIN = 5
/** A check-up only re-tests mastered facts she hasn't practiced for at least this many days. */
const CHECKUP_GAP = 7

export type Rng = () => number

interface Reask {
  id: string
  /** Asked once this many questions have gone by. */
  at: number
}

export interface SessionState {
  day: number
  length: number
  startedAt: number
  asked: number
  history: string[]
  scored: string[]
  requeue: Reask[]
  reasks: Record<string, number>
  /** Minimum easy questions between hard ones; grows when she struggles. */
  hardGap: number
  sinceHard: number
  /** Hard questions in a row; capped at two while reviews are waiting. */
  hardStreak: number
  firstTry: number
  right: number
  fast: number
  newMet: string[]
  mastered: string[]
  missed: string[]
  fixed: string[]
  /** Tables she proved she already knows this session (by helper factor). */
  placed: number[]
  checkup: CheckupState
  run: number
  bestRun: number
}

export interface CheckupState {
  planned: number
  queue: string[]
  asked: number
  right: number
  fast: number
}

export function createSession(length: number, day: number, startedAt: number, checkup: string[] = []): SessionState {
  return {
    day,
    length,
    startedAt,
    asked: 0,
    history: [],
    scored: [],
    requeue: [],
    reasks: {},
    hardGap: 1,
    sinceHard: 0,
    hardStreak: 0,
    firstTry: 0,
    right: 0,
    fast: 0,
    newMet: [],
    mastered: [],
    missed: [],
    fixed: [],
    placed: [],
    checkup: { planned: checkup.length, queue: [...checkup], asked: 0, right: 0, fast: 0 },
    run: 0,
    bestRun: 0,
  }
}

const pick = <T>(xs: T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)]

function shuffled<T>(xs: T[], rng: Rng): T[] {
  const out = [...xs]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Mastered facts to re-test at the start of this session, one per turnaround pair,
 * or [] when a check-up isn't due yet (every CHECKUP_EVERY days, once there's enough to test).
 */
export function planCheckup(p: Progress, today: number, rng: Rng = Math.random): string[] {
  if (p.lastCheckupDay >= 0 && today - p.lastCheckupDay < CHECKUP_EVERY) return []
  const candidates = Object.keys(p.facts).filter((id) => {
    const f = p.facts[id]
    return f.level >= MASTERED && f.lastDay >= 0 && today - f.lastDay >= CHECKUP_GAP
  })
  const oneEach = new Map<string, string>()
  for (const id of shuffled(candidates, rng)) if (!oneEach.has(familyOf(id))) oneEach.set(familyOf(id), id)
  return oneEach.size >= CHECKUP_MIN ? [...oneEach.values()].slice(0, CHECKUP_SIZE) : []
}

/** Saves the check-up result once every planned question has had its first try. */
export function finishCheckup(p: Progress, s: SessionState, now: number): void {
  const c = s.checkup
  if (c.planned === 0 || c.asked < c.planned) return
  p.checkups.push({ at: now, day: s.day, asked: c.asked, right: c.right, fast: c.fast })
  p.lastCheckupDay = s.day
}

/**
 * Chooses the next question, or null when the session is over.
 *
 * Mostly facts she knows, with a new or still-learning fact slotted in every
 * `hardGap` questions. Missed facts come back a few questions later.
 */
export function nextQuestion(p: Progress, s: SessionState, rng: Rng = Math.random): Question | null {
  const recent = s.history.slice(-RECENT_FAMILIES).map(familyOf)
  const fresh = (id: string) => !recent.includes(familyOf(id))
  const overtime = s.asked >= s.length
  if (overtime && (s.requeue.length === 0 || s.asked >= s.length + MAX_OVERTIME)) return null

  const ready = s.requeue.filter((r) => overtime || r.at <= s.asked)
  const reask = ready.find((r) => fresh(r.id)) ?? (overtime ? ready[0] : undefined)
  if (reask) {
    s.requeue.splice(s.requeue.indexOf(reask), 1)
    return ask(s, reask.id, 'reask')
  }

  const checkup = s.checkup.queue.find(fresh)
  if (checkup) {
    s.checkup.queue.splice(s.checkup.queue.indexOf(checkup), 1)
    return ask(s, checkup, 'checkup')
  }

  const ids = Object.keys(p.facts)
  const stat = (id: string) => p.facts[id]
  const open = (id: string) => fresh(id) && !s.scored.includes(id)
  const byNeed = (x: string, y: string) => stat(x).level - stat(y).level || stat(x).due - stat(y).due

  const learningTotal = ids.filter((id) => stat(id).level === 1).length
  const learning = ids.filter((id) => stat(id).level === 1 && open(id))
  const newcomer = INTRO_ORDER.find((id) => stat(id).level === 0 && fresh(id))
  const canAdd = newcomer !== undefined && learningTotal < MAX_LEARNING
  const due = ids.filter((id) => stat(id).level >= 2 && stat(id).due <= s.day && open(id)).sort(byNeed)
  const known = ids.filter((id) => stat(id).level >= 2 && stat(id).due > s.day && open(id)).sort(byNeed)

  if (s.sinceHard >= s.hardGap && !(s.hardStreak >= 2 && due.length > 0)) {
    const preferLearning = !canAdd || learningTotal >= MAX_LEARNING / 2 || rng() < 0.5
    if (learning.length > 0 && preferLearning) return ask(s, pick(learning, rng), 'learning')
    if (canAdd && newcomer) return ask(s, newcomer, 'new')
  }
  if (due.length > 0) return ask(s, pick(due.slice(0, 3), rng), 'review')
  if (known.length > 0) return ask(s, pick(known.slice(0, 5), rng), 'filler')
  if (learning.length > 0) return ask(s, pick(learning, rng), 'learning')
  if (canAdd && newcomer) return ask(s, newcomer, 'new')
  const spare = ids.filter((id) => fresh(id) && stat(id).level > 0)
  return ask(s, pick(spare.length > 0 ? spare : ids.filter(fresh), rng), 'extra')
}

function ask(s: SessionState, id: string, kind: QuestionKind): Question {
  s.asked += 1
  s.history.push(id)
  const hard = kind === 'new' || kind === 'learning' || kind === 'reask'
  s.sinceHard = hard ? 0 : s.sinceHard + 1
  s.hardStreak = hard ? s.hardStreak + 1 : 0
  const { a, b, answer } = parseFact(id)
  return { id, a, b, answer, kind }
}

/** Records an answer (or "show me", as a wrong answer) and returns how it went. */
export function recordAnswer(p: Progress, s: SessionState, q: Question, correct: boolean, ms: number): Outcome {
  const outcome = classify(correct, ms, fastThreshold(p.motor, q.answer))
  s.run = correct ? s.run + 1 : 0
  s.bestRun = Math.max(s.bestRun, s.run)

  if (q.kind === 'reask' || s.scored.includes(q.id)) {
    const count = (s.reasks[q.id] ?? 0) + 1
    s.reasks[q.id] = count
    if (correct) {
      if (s.missed.includes(q.id) && !s.fixed.includes(q.id)) s.fixed.push(q.id)
    } else if (count < MAX_REASKS && s.asked < s.length) {
      s.requeue.push({ id: q.id, at: s.asked + 2 })
    }
    return outcome
  }

  const stat = p.facts[q.id]
  const before = stat.level
  scoreFirstTry(stat, outcome, ms, s.day)
  s.scored.push(q.id)
  s.firstTry += 1
  if (correct) s.right += 1
  if (outcome === 'fast') s.fast += 1
  if (before === 0) s.newMet.push(q.id)
  if (before < MASTERED && stat.level >= MASTERED) s.mastered.push(q.id)
  if (correct && stageOf(q.a, q.b) === 1) p.motor = [...p.motor, Math.round(ms)].slice(-15)
  if (q.kind === 'checkup') {
    s.checkup.asked += 1
    if (correct) s.checkup.right += 1
    if (outcome === 'fast') s.checkup.fast += 1
  }

  if (q.kind === 'new' || q.kind === 'learning') {
    s.hardGap = outcome === 'fast' ? Math.max(0, s.hardGap - 1) : Math.min(3, s.hardGap + 1)
  }
  if (q.kind === 'new' && outcome === 'fast') placeTable(p, s, helperOf(q.a, q.b)[0])
  if (!correct) {
    s.missed.push(q.id)
    s.requeue.push({ id: q.id, at: s.asked + 2 }, { id: q.id, at: s.asked + 6 })
  } else if (outcome === 'slow' && (q.kind === 'new' || q.kind === 'learning')) {
    // Right but still worked out: one more go later builds speed.
    s.requeue.push({ id: q.id, at: s.asked + 4 })
  }
  return outcome
}

/**
 * Once she has aced the first few facts of a table on sight, inks the rest of it
 * (due over the next few days) instead of introducing each one. Reviews confirm them.
 */
function placeTable(p: Progress, s: SessionState, helper: number): void {
  const group = INTRO_ORDER.filter((id) => {
    const { a, b } = parseFact(id)
    return helperOf(a, b)[0] === helper
  })
  const tried = group.filter((id) => p.facts[id].seen > 0)
  const aced = tried.filter((id) => p.facts[id].level >= 3 && p.facts[id].right === p.facts[id].seen)
  if (aced.length < PLACEMENT_RUN || aced.length < tried.length) return
  let spread = 0
  for (const id of group) {
    const stat = p.facts[id]
    if (stat.level !== 0) continue
    stat.level = 2
    stat.due = s.day + 1 + (spread++ % 3)
  }
  if (spread > 0) s.placed.push(helper)
}
