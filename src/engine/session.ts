import { familyOf, helperOf, INTRO_ORDER, parseFact, stageOf } from './facts'
import { classify, fastThreshold, MASTERED, scoreFirstTry } from './progress'
import type { CheckupState, Outcome, PartKind, Progress, Question, QuestionForm, QuestionKind, SessionState } from './types'

export type { CheckupState, SessionState } from './types'

/** Most facts she can be actively learning (pencil level) before new facts pause. */
export const MAX_LEARNING = 8
/** New facts a day that can land in pencil (missed or slow) before the rest wait for tomorrow. */
export const MAX_NEW_STRUGGLES = 4
/** A fact's turnaround family won't repeat within this many questions. */
const RECENT_FAMILIES = 2
/** Recent facts remembered, enough to keep a lightning lap from repeating itself. */
const HISTORY = 60
/** Extra questions allowed past a part's length to finish pending fix-ups. */
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
/** Below this many known facts, puzzles fall back to ×1 facts too. */
const PUZZLE_MIN_POOL = 6
/** Below this many colored-in facts, the lightning lap uses inked facts too. */
const LIGHTNING_MIN_POOL = 10

export type Rng = () => number

/**
 * A new session. On the daily page one session runs the whole day, part after part;
 * on its own it's a single practice part of `length` questions.
 */
export function createSession(length: number, day: number, startedAt: number, checkup: string[] = []): SessionState {
  return {
    day,
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
    part: { kind: 'mixed', length, start: 0, firstTry: 0, right: 0, fast: 0 },
  }
}

/** Moves the session on to a new part. Fix-ups still waiting from the last part are dropped. */
export function startPart(s: SessionState, kind: PartKind, length: number): void {
  s.part = { kind, length, start: s.asked, firstTry: 0, right: 0, fast: 0 }
  s.requeue = []
}

/** Questions asked so far in the current part, re-asks included. */
export const partAsked = (s: SessionState): number => s.asked - s.part.start

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
  const c: CheckupState = s.checkup
  if (c.planned === 0 || c.asked < c.planned || p.lastCheckupDay === s.day) return
  p.checkups.push({ at: now, day: s.day, asked: c.asked, right: c.right, fast: c.fast })
  p.lastCheckupDay = s.day
}

/** Known facts (inked or better) to turn into puzzles: missing numbers and division. */
export function puzzlePool(p: Progress): string[] {
  const known = Object.keys(p.facts).filter((id) => p.facts[id].level >= 2)
  const notOnes = known.filter((id) => !id.split('x').includes('1'))
  return notOnes.length >= PUZZLE_MIN_POOL ? notOnes : known
}

/** Facts she knows well enough to race through in the lightning lap. */
export function lightningPool(p: Progress): string[] {
  const ids = Object.keys(p.facts)
  const coloredIn = ids.filter((id) => p.facts[id].level >= 3)
  return coloredIn.length >= LIGHTNING_MIN_POOL ? coloredIn : ids.filter((id) => p.facts[id].level >= 2)
}

/** How many more new facts could still land in pencil today: free learning slots, within the daily limit. */
function newFactRoom(p: Progress, s: SessionState): number {
  const learning = Object.values(p.facts).filter((f) => f.level === 1).length
  const struggled = s.newMet.filter((id) => p.facts[id].level === 1).length
  return Math.max(0, Math.min(MAX_LEARNING - learning, MAX_NEW_STRUGGLES - struggled))
}

const roomToAdd = (p: Progress, s: SessionState) => newFactRoom(p, s) > 0

/**
 * About how many questions a practice part can fill today without repeating facts already
 * tried: facts not yet tried today, plus the new ones there's still room for.
 */
export function practiceRoom(p: Progress, s: SessionState): number {
  const ids = Object.keys(p.facts).filter((id) => !s.scored.includes(id))
  const started = ids.filter((id) => p.facts[id].level >= 1).length
  return started + Math.min(ids.length - started, newFactRoom(p, s))
}

/** Whether there's anything new or still being learned for a "new facts" part. */
export function hasLearningWork(p: Progress): boolean {
  const levels = Object.values(p.facts).map((f) => f.level)
  const learning = levels.filter((l) => l === 1).length
  return learning > 0 || (levels.includes(0) && learning < MAX_LEARNING)
}

/**
 * Chooses the next question, or null when the current part is over.
 *
 * Practice parts are mostly facts she knows, with a new or still-learning fact slotted in
 * every `hardGap` questions; the "new facts" part slots them in at least every third question.
 * Warm-ups stick to reviews, puzzles turn known facts around, and the lightning lap races
 * through colored-in facts. Missed questions come back a few questions later.
 */
export function nextQuestion(p: Progress, s: SessionState, rng: Rng = Math.random): Question | null {
  const kind = s.part.kind
  const recent = s.history.slice(-RECENT_FAMILIES).map(familyOf)
  const fresh = (id: string) => !recent.includes(familyOf(id))
  const done = partAsked(s)
  const overtime = done >= s.part.length
  if (overtime && (s.requeue.length === 0 || done >= s.part.length + MAX_OVERTIME)) return null

  const ready = s.requeue.filter((r) => overtime || r.at <= s.asked)
  const reask = ready.find((r) => fresh(r.id)) ?? (overtime ? ready[0] : undefined)
  if (reask) {
    s.requeue.splice(s.requeue.indexOf(reask), 1)
    return ask(s, reask.id, 'reask', reask.form)
  }

  if (kind === 'puzzles') return nextPuzzle(p, s, fresh, rng)
  if (kind === 'lightning') return nextLightning(p, s, fresh, done, rng)

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
  const addRoom = roomToAdd(p, s)
  const canAdd = newcomer !== undefined && addRoom
  const due = ids.filter((id) => stat(id).level >= 2 && stat(id).due <= s.day && open(id)).sort(byNeed)
  const known = ids.filter((id) => stat(id).level >= 2 && stat(id).due > s.day && open(id)).sort(byNeed)

  if (kind === 'warmup') {
    // Easy ones to get going: reviews first, then facts she knows. Nothing new yet.
    if (due.length > 0) return ask(s, pick(due.slice(0, 3), rng), 'review')
    if (known.length > 0) return ask(s, pick(known.slice(-8), rng), 'filler')
  } else {
    if (kind === 'new') {
      const moreToLearn =
        ids.some((id) => stat(id).level === 1 && !s.scored.includes(id)) || (addRoom && INTRO_ORDER.some((id) => stat(id).level === 0))
      // Nothing left to learn today: the part ends early rather than padding with easy facts.
      if (!moreToLearn && s.requeue.length === 0) return null
    }
    // The new-facts part slots hard ones in more often, but still eases off when she struggles.
    const gap = kind === 'new' ? Math.min(2, s.hardGap) : s.hardGap
    if (s.sinceHard >= gap && !(s.hardStreak >= 2 && due.length > 0)) {
      const preferLearning = !canAdd || learningTotal >= MAX_LEARNING / 2 || rng() < 0.5
      if (learning.length > 0 && preferLearning) return ask(s, pick(learning, rng), 'learning')
      if (canAdd && newcomer) return ask(s, newcomer, 'new')
    }
    if (due.length > 0) return ask(s, pick(due.slice(0, 3), rng), 'review')
    if (known.length > 0) return ask(s, pick(known.slice(0, 5), rng), 'filler')
    if (learning.length > 0) return ask(s, pick(learning, rng), 'learning')
    if (canAdd && newcomer) return ask(s, newcomer, 'new')
  }
  const spare = ids.filter((id) => fresh(id) && stat(id).level > 0)
  return ask(s, pick(spare.length > 0 ? spare : ids.filter(fresh), rng), 'extra')
}

const PUZZLE_FORMS: QuestionForm[] = ['divide', 'divide', 'missing-b', 'missing-a']

function nextPuzzle(p: Progress, s: SessionState, fresh: (id: string) => boolean, rng: Rng): Question {
  const pool = puzzlePool(p).filter(fresh)
  const id = pool.length > 0 ? pick(pool, rng) : pick(Object.keys(p.facts).filter(fresh), rng)
  return ask(s, id, 'puzzle', pick(PUZZLE_FORMS, rng))
}

function nextLightning(p: Progress, s: SessionState, fresh: (id: string) => boolean, done: number, rng: Rng): Question {
  const lap = new Set(s.history.slice(s.history.length - Math.min(done, s.history.length)))
  const pool = lightningPool(p).filter((id) => fresh(id) && !lap.has(id))
  // Facts not yet tried today come first, so the lap's first tries count toward the doodle page too.
  const untried = pool.filter((id) => !s.scored.includes(id))
  const choices = untried.length > 0 ? untried : pool.length > 0 ? pool : lightningPool(p).filter(fresh)
  return ask(s, pick(choices.length > 0 ? choices : Object.keys(p.facts).filter(fresh), rng), 'lightning')
}

/** The number she types for a fact shown in the given form. */
export function answerFor(a: number, b: number, form: QuestionForm): number {
  if (form === 'missing-a') return a
  if (form === 'missing-b' || form === 'divide') return b
  return a * b
}

function ask(s: SessionState, id: string, kind: QuestionKind, form: QuestionForm = 'times'): Question {
  s.asked += 1
  s.history.push(id)
  if (s.history.length > HISTORY) s.history.splice(0, s.history.length - HISTORY)
  const hard = kind === 'new' || kind === 'learning' || (kind === 'reask' && form === 'times')
  s.sinceHard = hard ? 0 : s.sinceHard + 1
  s.hardStreak = hard ? s.hardStreak + 1 : 0
  const { a, b } = parseFact(id)
  return { id, a, b, answer: answerFor(a, b, form), kind, form }
}

const reaskKey = (q: Question) => (q.form === 'times' ? q.id : `${q.id}:${q.form}`)

/** Records an answer (or "show me", as a wrong answer) and returns how it went. */
export function recordAnswer(p: Progress, s: SessionState, q: Question, correct: boolean, ms: number): Outcome {
  // Puzzles and plain facts share the speed goal: both are recall of the same fact.
  const outcome = classify(correct, ms, fastThreshold(p.motor, q.a * q.b) + (q.form === 'times' ? 0 : 1000))
  s.run = correct ? s.run + 1 : 0
  s.bestRun = Math.max(s.bestRun, s.run)
  const canRequeue = s.part.kind !== 'lightning' && partAsked(s) < s.part.length
  if (q.kind !== 'reask') {
    s.part.firstTry += 1
    if (correct) s.part.right += 1
    if (outcome === 'fast') s.part.fast += 1
  }

  if (q.form !== 'times') {
    // Puzzles are practice: they never move a fact's doodle level.
    const count = (s.reasks[reaskKey(q)] ?? 0) + (q.kind === 'reask' ? 1 : 0)
    s.reasks[reaskKey(q)] = count
    if (!correct && count < MAX_REASKS && canRequeue) s.requeue.push({ id: q.id, at: s.asked + 3, form: q.form })
    return outcome
  }

  if (q.kind === 'reask' || s.scored.includes(q.id)) {
    const count = (s.reasks[q.id] ?? 0) + 1
    s.reasks[q.id] = count
    if (correct) {
      if (s.missed.includes(q.id) && !s.fixed.includes(q.id)) s.fixed.push(q.id)
    } else if (count < MAX_REASKS && canRequeue) {
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
    if (canRequeue) s.requeue.push({ id: q.id, at: s.asked + 2 }, { id: q.id, at: s.asked + 6 })
  } else if (outcome === 'slow' && (q.kind === 'new' || q.kind === 'learning') && canRequeue) {
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
