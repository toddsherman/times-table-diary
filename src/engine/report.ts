import { factId, FACTORS } from './facts'
import { levelCounts, MASTERED, streak } from './progress'
import type { AnswerRecord, Checkup, DayLog, Progress } from './types'

export interface CalendarDay {
  day: number
  entries: number
  /** Practice time that day, in whole minutes. */
  minutes: number
  /** A finished page (or an older-style diary entry), part of a page, or nothing. */
  status: 'page' | 'partial' | 'none'
  /** Parts done of the parts on the page, when the day was on the daily page. */
  done: number
  parts: number
}

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
  /** The last 28 days, oldest first. */
  calendar: CalendarDay[]
  /** The last 7 days: practice minutes and pages finished. */
  week: { minutes: number; pages: number }
  /** Days on the daily page, newest first (up to 14). */
  recent: DayLog[]
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

  const perDay = new Map<number, { entries: number; minutes: number }>()
  for (const e of p.entries) {
    const d = perDay.get(e.day) ?? { entries: 0, minutes: 0 }
    perDay.set(e.day, { entries: d.entries + 1, minutes: d.minutes + e.stats.minutes })
  }
  const logs = new Map(p.days.map((d) => [d.day, d]))
  const calendar = Array.from({ length: 28 }, (_, i): CalendarDay => {
    const day = today - 27 + i
    const entries = perDay.get(day)
    const log = logs.get(day)
    // Days on the daily page have a log with the real practice time; older days only have entries.
    const minutes = log ? Math.round(log.activeMs / 60_000) : (entries?.minutes ?? 0)
    const status = entries ? 'page' : log && log.questions > 0 ? 'partial' : 'none'
    return { day, entries: entries?.entries ?? 0, minutes, status, done: log?.done ?? 0, parts: log?.parts ?? 0 }
  })
  const lastWeek = calendar.slice(-7)
  const week = {
    minutes: lastWeek.reduce((n, d) => n + d.minutes, 0),
    pages: lastWeek.filter((d) => d.status === 'page').length,
  }

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
    week,
    recent: p.days.filter((d) => d.questions > 0 && d.day > today - 28).reverse().slice(0, 14),
  }
}
