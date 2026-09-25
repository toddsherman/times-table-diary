/**
 * Doodle levels, from blank page to gold star:
 * 0 blank · 1 pencil (learning) · 2 inked · 3 colored in · 4 sparkly (mastered) · 5 gold star
 */
export type Level = 0 | 1 | 2 | 3 | 4 | 5

export interface FactStat {
  level: Level
  /** Day number when the fact is next due for review. */
  due: number
  /** First tries across all sessions. */
  seen: number
  /** First tries answered correctly. */
  right: number
  /** Most recent correct response times in ms, newest last. */
  times: number[]
  /** Day number of the last first try, or -1 if never practiced. */
  lastDay: number
}

export interface Settings {
  sessionLength: number
  sound: boolean
}

export interface EntryStats {
  total: number
  firstTry: number
  right: number
  fast: number
  minutes: number
  /** Facts at sparkly or better when the entry was written. Missing on the earliest entries. */
  mastered?: number
}

/** A retention check-up: mastered facts she hadn't practiced for a week or more. */
export interface Checkup {
  at: number
  day: number
  asked: number
  right: number
  fast: number
}

export interface DiaryEntry {
  day: number
  at: number
  lines: string[]
  sticker: string
  stats: EntryStats
}

export interface Progress {
  version: 1
  name: string
  createdDay: number
  facts: Record<string, FactStat>
  /** Recent correct response times (ms) on ×1 and ×10 facts, used to tune what counts as fast. */
  motor: number[]
  entries: DiaryEntry[]
  stickers: string[]
  checkups: Checkup[]
  /** Day of the last check-up, or -1 before the first one. */
  lastCheckupDay: number
  settings: Settings
  /** When the name or settings last changed (ms), so syncing keeps the newest. */
  settingsAt: number
  /** When anything last changed (ms). */
  updatedAt: number
}

export type Outcome = 'fast' | 'slow' | 'wrong'

export type QuestionKind = 'new' | 'learning' | 'review' | 'filler' | 'reask' | 'extra' | 'checkup'

export interface Question {
  id: string
  a: number
  b: number
  answer: number
  kind: QuestionKind
}

/** One answer, as logged to the server for the progress report. */
export interface AnswerRecord {
  at: number
  day: number
  fact: string
  /** What she typed, or null for "Show me how". */
  given: number | null
  correct: boolean
  ms: number
  kind: QuestionKind
  outcome: Outcome
  before: Level
  after: Level
}
