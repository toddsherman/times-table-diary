import { INTRO_ORDER, parseFact, stageOf } from './facts'
import type { FactStat, Level, Outcome, Progress, Settings } from './types'

/** Level at which a fact counts as mastered: fast on at least two or three separate days. */
export const MASTERED: Level = 4

export const LEVELS: ReadonlyArray<{ name: string; note: string }> = [
  { name: 'Blank', note: 'Not started yet' },
  { name: 'Pencil sketch', note: 'Still learning' },
  { name: 'Inked', note: 'Almost there' },
  { name: 'Colored in', note: 'Got it!' },
  { name: 'Sparkly', note: 'Mastered!' },
  { name: 'Gold star', note: 'Superstar!' },
]

/** Days until the next review, by level (a Leitner box schedule). */
const INTERVAL_DAYS: Record<Level, number> = { 0: 0, 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 }

export const DEFAULT_SETTINGS: Settings = { sessionLength: 20, sound: true }

/**
 * A fresh diary. ×1 and ×10 facts start inked (assumed known, checked over the
 * first few days) so early sessions have easy wins to mix with new facts.
 */
export function createProgress(name: string, today: number): Progress {
  const facts: Record<string, FactStat> = {}
  let spread = 0
  for (const id of INTRO_ORDER) {
    const { a, b } = parseFact(id)
    const rule = stageOf(a, b) === 1
    facts[id] = {
      level: rule ? 2 : 0,
      due: rule ? today + (spread++ % 3) : today,
      seen: 0,
      right: 0,
      times: [],
      lastDay: -1,
    }
  }
  return {
    version: 1,
    name,
    createdDay: today,
    facts,
    motor: [],
    entries: [],
    stickers: [],
    checkups: [],
    lastCheckupDay: -1,
    settings: { ...DEFAULT_SETTINGS },
    settingsAt: 0,
    updatedAt: 0,
  }
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((x, y) => x - y)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * How quickly an answer must come to count as known by heart. Tuned to how long
 * she takes on facts that need no thinking (×1, ×10), so typing speed isn't
 * mistaken for not knowing.
 */
export function fastThreshold(motor: number[], answer: number): number {
  const base = motor.length >= 5 ? median(motor) : 1200
  const limit = Math.min(5000, Math.max(2500, base + 1800))
  return limit + (answer >= 100 ? 400 : 0)
}

export function classify(correct: boolean, ms: number, limit: number): Outcome {
  if (!correct) return 'wrong'
  return ms <= limit ? 'fast' : 'slow'
}

/** Updates a fact after its first try of a session. Re-asks within a session don't count. */
export function scoreFirstTry(stat: FactStat, outcome: Outcome, ms: number, today: number): void {
  const wasDue = stat.due <= today
  stat.seen += 1
  if (outcome !== 'wrong') {
    stat.right += 1
    stat.times = [...stat.times, Math.round(ms)].slice(-5)
  }

  if (outcome === 'wrong') {
    // A slip on a well-known fact drops it to inked; otherwise back to pencil.
    stat.level = stat.level >= 3 ? 2 : 1
    stat.due = today + INTERVAL_DAYS[stat.level]
  } else if (outcome === 'slow') {
    // Right but still working it out: no promotion, and check again soon.
    if (stat.level === 0) stat.level = 1
    stat.due = today + Math.min(1, INTERVAL_DAYS[stat.level])
  } else if (stat.level === 0) {
    // Knew it instantly the first time she saw it.
    stat.level = 3
    stat.due = today + INTERVAL_DAYS[3]
  } else if (wasDue) {
    stat.level = Math.min(5, stat.level + 1) as Level
    stat.due = today + INTERVAL_DAYS[stat.level]
  }
  stat.lastDay = today
}

export function masteredCount(p: Progress): number {
  return Object.values(p.facts).filter((f) => f.level >= MASTERED).length
}

export function levelCounts(p: Progress): number[] {
  const counts = [0, 0, 0, 0, 0, 0]
  for (const f of Object.values(p.facts)) counts[f.level] += 1
  return counts
}

/** Diary days in a row, forgiving a single skipped day between entries. */
export function streak(entries: ReadonlyArray<{ day: number }>, today: number): number {
  const days = [...new Set(entries.map((e) => e.day))].sort((x, y) => y - x)
  if (days.length === 0 || today - days[0] > 2) return 0
  let count = 1
  for (let i = 1; i < days.length && days[i - 1] - days[i] <= 2; i++) count += 1
  return count
}

/** Facts she has missed or is still learning (pencil level), shakiest first. */
export function trickiestFacts(p: Progress, limit = 8): string[] {
  return Object.entries(p.facts)
    .filter(([, f]) => f.seen > 0 && f.level <= 2 && (f.level === 1 || f.right < f.seen))
    .sort(([, x], [, y]) => x.right / x.seen - y.right / y.seen || x.level - y.level || y.seen - x.seen)
    .slice(0, limit)
    .map(([id]) => id)
}

/** A copy with new settings, stamped so syncing knows these are the newest. */
export function withSettings(p: Progress, patch: Partial<Settings>, now = Date.now()): Progress {
  return { ...p, settings: { ...p.settings, ...patch }, settingsAt: now, updatedAt: now }
}
