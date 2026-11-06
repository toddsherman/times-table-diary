import { ALL_FACT_IDS } from './facts'
import type { DayLog, DayPlan, FactStat, Progress } from './types'

/** The copy of a fact with more practice behind it (placement and scheduling break ties). */
function morePracticed(x: FactStat, y: FactStat): FactStat {
  if (x.seen !== y.seen) return x.seen > y.seen ? x : y
  if (x.lastDay !== y.lastDay) return x.lastDay > y.lastDay ? x : y
  if (x.level !== y.level) return x.level > y.level ? x : y
  return x.due >= y.due ? x : y
}

function unionBy<T>(xs: T[], ys: T[], key: (item: T) => number): T[] {
  const byKey = new Map<number, T>()
  for (const item of [...xs, ...ys]) if (!byKey.has(key(item))) byKey.set(key(item), item)
  return [...byKey.values()].sort((a, b) => key(a) - key(b))
}

/**
 * The later day's page, or on the same day the later lesson (a new lesson only starts once the
 * one before it is finished), or on the same lesson, the copy with more of it done.
 */
function laterPage(x: DayPlan | undefined, y: DayPlan | undefined): DayPlan | undefined {
  if (!x || !y) return x ?? y
  if (x.day !== y.day) return x.day > y.day ? x : y
  if ((x.lesson ?? 1) !== (y.lesson ?? 1)) return (x.lesson ?? 1) > (y.lesson ?? 1) ? x : y
  if (x.finished !== y.finished) return x.finished ? x : y
  return y.session.asked > x.session.asked ? y : x
}

/** Per day, the log line with more practice in it. */
function mergeDays(xs: DayLog[], ys: DayLog[]): DayLog[] {
  const byDay = new Map<number, DayLog>()
  for (const d of [...xs, ...ys]) {
    const seen = byDay.get(d.day)
    if (!seen || d.questions > seen.questions) byDay.set(d.day, d)
  }
  return [...byDay.values()].sort((x, y) => x.day - y.day)
}

/**
 * Combines two copies of the same diary (say, this iPad's and the server's) without
 * losing practice from either. Each fact keeps whichever copy has seen more practice,
 * diary pages and check-ups are pooled, and settings follow whichever changed last.
 * If both worked on today's page, the copy that got further keeps it.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const facts: Record<string, FactStat> = {}
  for (const id of ALL_FACT_IDS) facts[id] = morePracticed(a.facts[id], b.facts[id])
  const entries = unionBy(a.entries, b.entries, (e) => e.at)
  const owner = b.settingsAt > a.settingsAt ? b : a
  const newer = b.updatedAt > a.updatedAt ? b : a
  const today = laterPage(a.today, b.today)
  return {
    version: 1,
    name: owner.name,
    createdDay: Math.min(a.createdDay, b.createdDay),
    facts,
    motor: newer.motor,
    entries,
    stickers: entries.map((e) => e.sticker),
    checkups: unionBy(a.checkups, b.checkups, (c) => c.at),
    lastCheckupDay: Math.max(a.lastCheckupDay, b.lastCheckupDay),
    settings: owner.settings,
    settingsAt: owner.settingsAt,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    ...(today ? { today } : {}),
    days: mergeDays(a.days, b.days),
    pace: newer.pace,
    bestLightning: Math.max(a.bestLightning, b.bestLightning),
  }
}

export function sameProgress(a: Progress, b: Progress): boolean {
  // Normalizing through the merge gives both sides the same key order.
  return JSON.stringify(mergeProgress(a, a)) === JSON.stringify(mergeProgress(b, b))
}
