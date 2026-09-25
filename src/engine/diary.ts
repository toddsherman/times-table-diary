import { showFact } from './facts'
import type { Rng, SessionState } from './session'
import type { DiaryEntry } from './types'

const pick = <T>(xs: readonly T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)]

const OPENERS = [
  'OMG! You will NOT believe what happened today.',
  "Okay, so here's what happened.",
  'I have BIG news.',
  "Today was kind of AMAZING. Here's why.",
  'Math time again! And guess what?',
  'So. Much. Math. But in a good way!',
]

const PERFECT = [
  'I got EVERY SINGLE ONE right on the first try. Is this even real life?!',
  'Zero mistakes. ZERO! I might frame this page.',
]

const TOUGH = [
  'Some facts were super tricky today. But tricky facts make brains stronger!',
  'Okay, today was HARD. But I kept going, and that counts. A lot.',
]

const CLOSERS = [
  'Okay, gotta go. More tomorrow!',
  'That is all for now. Math genius, signing off!',
  'Until tomorrow, Diary!',
  "SQUEEE!!! (That's my happy noise.)",
  'Time for a snack. Brains need snacks.',
]

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
}

/** Writes the end-of-session diary entry in a dramatic, first-person diary voice. */
export function writeEntry(s: SessionState, { streakDays, sticker, now, mastered }: EntryContext, rng: Rng = Math.random): DiaryEntry {
  const minutes = Math.max(1, Math.round((now - s.startedAt) / 60_000))
  const time = minutes === 1 ? 'about a minute' : `${minutes} minutes`
  const speedy = s.fast > 0 && s.fast >= s.firstTry / 2 ? `, and ${s.fast} were SUPER fast` : ''
  const lines = [pick(OPENERS, rng), `I did ${s.asked} times table facts in ${time}${speedy}.`]

  const checkup = s.checkup
  if (checkup.planned > 0 && checkup.asked === checkup.planned) {
    lines.push(
      checkup.right === checkup.asked
        ? `Check-up day! I still knew ALL ${checkup.asked} of my sparkly facts. My brain is basically a vault.`
        : `Check-up day! I still knew ${checkup.right} of my ${checkup.asked} sparkly facts. The others are back in practice.`,
    )
  }

  if (s.firstTry > 0 && s.right === s.firstTry) lines.push(pick(PERFECT, rng))
  else if (s.firstTry > 0 && s.right / s.firstTry < 0.6) lines.push(pick(TOUGH, rng))
  if (s.mastered.length > 0) lines.push(`${listFacts(s.mastered)} got sparkles on my doodle page. SQUEEE!!!`)
  if (s.fixed.length > 0) {
    const fact = showFact(s.fixed[0])
    lines.push(`${fact} tried to trick me, but I figured it out. Take THAT, ${fact}!`)
  }
  if (s.placed.length > 0) {
    const tables = s.placed.map((h) => `${h}s`)
    const named = tables.length === 1 ? tables[0] : `${tables.slice(0, -1).join(', ')} and ${tables.at(-1)}`
    lines.push(`I already know my ${named}, so they got inked on my doodle page. Obviously.`)
  }
  if (s.newMet.length === 1) lines.push(`I met a new fact: ${showFact(s.newMet[0])}. Nice to meet you!`)
  else if (s.newMet.length > 1) lines.push(`I met ${s.newMet.length} new facts. My brain is basically growing as we speak.`)
  if (streakDays >= 2) lines.push(`That's ${streakDays} diary days in a row. I am UNSTOPPABLE.`)
  lines.push(pick(CLOSERS, rng))

  return {
    day: s.day,
    at: now,
    lines,
    sticker,
    stats: { total: s.asked, firstTry: s.firstTry, right: s.right, fast: s.fast, minutes, mastered },
  }
}
