import { factId, FACTORS } from './facts'
import { levelCounts, MASTERED, streak } from './progress'
import type { AnswerRecord, Checkup, Progress } from './types'

export interface Report {
  mastered: number
  coloredIn: number
  learning: number
  entries: number
  streak: number
  /** Mastered facts at the end of each diary day, oldest first, ending with today. */
  masteredByDay: Array<{ day: number; mastered: number }>
  /** Facts at sparkly or better in each row of the chart (t × 1 … t × 12). */
  tables: Array<{ table: number; mastered: number }>
  /**
   * First tries on facts that were already mastered, when they came back for review a week or
   * more later (or in a check-up), over the last 30 days. This is the ongoing retention measure.
   */
  retention: { asked: number; right: number; fast: number }
  checkups: Checkup[]
  /** Diary entries per day for the last 28 days, oldest first. */
  calendar: Array<{ day: number; entries: number }>
}

export function buildReport(p: Progress, answers: AnswerRecord[], today: number): Report {
  const counts = levelCounts(p)
  const mastered = counts[4] + counts[5]

  const byDay = new Map<number, number>()
  for (const e of p.entries) if (e.stats.mastered !== undefined) byDay.set(e.day, e.stats.mastered)
  byDay.set(today, mastered)
  const masteredByDay = [...byDay].sort(([x], [y]) => x - y).map(([day, count]) => ({ day, mastered: count }))

  const tables = FACTORS.map((t) => ({
    table: t,
    mastered: FACTORS.filter((b) => p.facts[factId(t, b)].level >= MASTERED).length,
  }))

  // The same answer can arrive twice if an upload is retried, so dedupe by time and fact.
  const unique = new Map<string, AnswerRecord>()
  for (const a of answers) unique.set(`${a.at}:${a.fact}`, a)
  const retested = [...unique.values()].filter(
    (a) => a.day > today - 30 && a.before >= MASTERED && (a.kind === 'review' || a.kind === 'checkup'),
  )
  const retention = {
    asked: retested.length,
    right: retested.filter((a) => a.correct).length,
    fast: retested.filter((a) => a.outcome === 'fast').length,
  }

  const perDay = new Map<number, number>()
  for (const e of p.entries) perDay.set(e.day, (perDay.get(e.day) ?? 0) + 1)
  const calendar = Array.from({ length: 28 }, (_, i) => {
    const day = today - 27 + i
    return { day, entries: perDay.get(day) ?? 0 }
  })

  return {
    mastered,
    coloredIn: counts[3] + mastered,
    learning: counts[1],
    entries: p.entries.length,
    streak: streak(p.entries, today),
    masteredByDay,
    tables,
    retention,
    checkups: [...p.checkups].sort((x, y) => x.at - y.at),
    calendar,
  }
}
