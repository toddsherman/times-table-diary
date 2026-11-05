import { showFact } from './facts'
import type { Rng, SessionState } from './session'
import type { DiaryEntry, PartKind, PartPlan } from './types'
import { DIARY_VOICE, type Voice } from './voice'

const pick = <T>(xs: readonly T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)]

function listFacts(ids: string[]): string {
  const names = ids.map(showFact)
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names[0]}, ${names[1]}, and ${names.length - 2} more`
}

export interface EntryContext {
  streakDays: number
  sticker: string
  now: number
  /** Facts at sparkly or better after the session. */
  mastered: number
  /** Practice time; worked out from the session's start when it isn't given. */
  minutes?: number
  /** The daily page's parts, and her lightning-lap record before today. */
  page?: { parts: PartPlan[]; bestBefore: number }
  /** Things that happened today worth a line of their own, from the theme (say, a creature hatching). */
  events?: string[]
}

function listParts(kinds: PartKind[], voice: Voice): string {
  const names = kinds.map((k) => voice.partNames[k])
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} AND ${names.at(-1)}`
}

function pageLines({ parts, bestBefore }: NonNullable<EntryContext['page']>, voice: Voice, rng: Rng): string[] {
  const lines = [voice.wholePage(listParts(parts.map((part) => part.kind), voice))]
  const puzzles = parts.find((part) => part.kind === 'puzzles' && part.firstTry > 0)
  if (puzzles) {
    const solved = puzzles.right === puzzles.firstTry ? `ALL ${puzzles.firstTry}` : `${puzzles.right} of ${puzzles.firstTry}`
    lines.push(`${voice.puzzles(solved)} ${pick(voice.puzzleQuips, rng)}`)
  }
  const lap = parts.find((part) => part.kind === 'lightning' && part.firstTry > 0)
  if (lap) {
    if (bestBefore === 0) lines.push(voice.lapFirst(lap.fast))
    else if (lap.fast > bestBefore) lines.push(voice.lapRecord(lap.fast))
    else if (lap.fast === bestBefore) lines.push(voice.lapTie(lap.fast))
    else lines.push(voice.lapBelow(lap.fast, bestBefore))
  }
  return lines
}

/** Writes the end-of-page entry, in the diary's voice unless a theme gives its own. */
export function writeEntry(
  s: SessionState,
  { streakDays, sticker, now, mastered, minutes: given, page, events = [] }: EntryContext,
  rng: Rng = Math.random,
  voice: Voice = DIARY_VOICE,
): DiaryEntry {
  const minutes = given ?? Math.max(1, Math.round((now - s.startedAt) / 60_000))
  const time = minutes === 1 ? 'about a minute' : `${minutes} minutes`
  const speedy = s.fast > 0 && s.fast >= s.firstTry / 2 ? s.fast : null
  const lines = [pick(voice.openers, rng), voice.did(s.asked, time, speedy)]
  if (page) lines.push(...pageLines(page, voice, rng))

  const checkup = s.checkup
  if (checkup.planned > 0 && checkup.asked === checkup.planned) {
    lines.push(checkup.right === checkup.asked ? voice.checkupAll(checkup.asked) : voice.checkupSome(checkup.right, checkup.asked))
  }

  if (s.firstTry > 0 && s.right === s.firstTry) lines.push(pick(voice.perfect, rng))
  else if (s.firstTry > 0 && s.right / s.firstTry < 0.6) lines.push(pick(voice.tough, rng))
  if (s.mastered.length > 0) lines.push(voice.mastered(listFacts(s.mastered)))
  if (s.fixed.length > 0) lines.push(voice.fixed(showFact(s.fixed[0])))
  if (s.placed.length > 0) {
    const tables = s.placed.map((h) => `${h}s`)
    const named = tables.length === 1 ? tables[0] : `${tables.slice(0, -1).join(', ')} and ${tables.at(-1)}`
    lines.push(voice.placed(named))
  }
  if (s.newMet.length === 1) lines.push(voice.metOne(showFact(s.newMet[0])))
  else if (s.newMet.length > 1) lines.push(voice.metMany(s.newMet.length))
  lines.push(...events)
  if (streakDays >= 2) lines.push(voice.streak(streakDays))
  lines.push(pick(voice.closers, rng))

  return {
    day: s.day,
    at: now,
    lines,
    sticker,
    stats: { total: s.asked, firstTry: s.firstTry, right: s.right, fast: s.fast, minutes, mastered, ...(page ? { parts: page.parts.length } : {}) },
  }
}
