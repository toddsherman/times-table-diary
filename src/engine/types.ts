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
  /** Questions in a bonus round (and in a whole session on app versions before the daily page). */
  sessionLength: number
  /** How long the daily page should take, in minutes. Sizes the page; no clock is ever shown. */
  dailyMinutes: number
  sound: boolean
  /** The look of the app: 'diary' (the original, and the default), 'bricks', 'creatures', 'ninja' or 'construction'. */
  theme?: string
}

export interface EntryStats {
  total: number
  firstTry: number
  right: number
  fast: number
  minutes: number
  /** Facts at sparkly or better when the entry was written. Missing on the earliest entries. */
  mastered?: number
  /** Parts on the daily page. Missing on entries from before the daily page. */
  parts?: number
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
  /** Today's page, while it's being worked on (and after, until the next day's starts). */
  today?: DayPlan
  /** One line per day she practiced on the daily page, for the progress report. */
  days: DayLog[]
  /** How long a question takes her in each kind of part (ms, including feedback), for sizing the page. */
  pace: Partial<Record<PartKind, number>>
  /** Most super-fast answers in one lightning lap. */
  bestLightning: number
}

export type Outcome = 'fast' | 'slow' | 'wrong'

export type QuestionKind = 'new' | 'learning' | 'review' | 'filler' | 'reask' | 'extra' | 'checkup' | 'puzzle' | 'lightning'

/**
 * How a fact is shown: plain `a × b = ?`, or as a puzzle with a factor missing
 * (`a × ? = c`, `? × b = c`) or as division (`c ÷ a = ?`).
 */
export type QuestionForm = 'times' | 'missing-a' | 'missing-b' | 'divide'

export interface Question {
  id: string
  a: number
  b: number
  /** What she types: the product, or the missing factor for a puzzle. */
  answer: number
  kind: QuestionKind
  form: QuestionForm
}

/** The parts of a daily page, in order. A bonus round can follow once the page is done. */
export type PartKind = 'warmup' | 'new' | 'mixed' | 'puzzles' | 'lightning' | 'bonus'

export interface Reask {
  id: string
  /** Asked once this many questions have gone by. */
  at: number
  form?: QuestionForm
}

export interface CheckupState {
  planned: number
  queue: string[]
  asked: number
  right: number
  fast: number
}

/** The part being worked on, as the question picker sees it. */
export interface PartState {
  kind: PartKind
  /** Questions planned for this part. Missed questions coming back can run a few past it. */
  length: number
  /** The session's `asked` count when this part began. */
  start: number
  /** First asks in this part (re-asks of a miss don't count), and how they went. */
  firstTry: number
  right: number
  fast: number
}

/** A day of practice. On the daily page it spans every part, so each fact is scored once a day. */
export interface SessionState {
  day: number
  startedAt: number
  /** Questions asked today, across all parts. */
  asked: number
  /** Recently asked facts, newest last. */
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
  part: PartState
}

export interface PartPlan {
  kind: PartKind
  /** Questions planned, sized from her pace so the whole page takes about the daily minutes. */
  planned: number
  done: boolean
  /** Questions asked, and first asks with how they went. Filled in when the part ends. */
  asked: number
  firstTry: number
  right: number
  fast: number
  /** Time spent answering (ms). Each question counts for at most 40 seconds, so breaks don't. */
  activeMs: number
}

export interface DayPlan {
  day: number
  /** Minutes the page was sized for. */
  minutes: number
  parts: PartPlan[]
  /** Index of the part being worked on, or of the next one to start. */
  current: number
  /** True while `session.part` is the current part (false between parts). */
  running: boolean
  session: SessionState
  /** The question on screen, so reopening the app asks it again instead of skipping it. */
  pending: Question | null
  activeMs: number
  /** True once the diary page for the day has been written. */
  finished: boolean
  /** Best lightning lap before today's, for "new record!". */
  bestBefore: number
  /** Lines the theme wants in today's entry, like a creature hatching, collected as they happen. */
  events?: string[]
}

/** A day's practice on the daily page, kept for the progress report. */
export interface DayLog {
  day: number
  /** Parts on the page (not counting bonus rounds), and how many are finished. */
  parts: number
  done: number
  activeMs: number
  questions: number
  puzzles: { asked: number; right: number }
  /** Super-fast answers in the lightning lap, if she did it. */
  lightning: { asked: number; fast: number } | null
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
  /** Missing on answers from before puzzles, which were all 'times'. */
  form?: QuestionForm
  outcome: Outcome
  before: Level
  after: Level
}
