import type { PartKind } from './types'

/**
 * How a theme writes the end-of-page entry: the diary's "Dear Diary" voice, a builder's log, and
 * so on. Every line the entry can have comes from here; `writeEntry` decides which ones to use.
 */
export interface Voice {
  /** First line. One is picked at random. */
  openers: readonly string[]
  /** "I did 181 times table facts in 21 minutes, and 86 were SUPER fast." `fast` is null when few were fast. */
  did: (count: number, time: string, fast: number | null) => string
  /** How each part of the page is named in a list, e.g. "a warm-up". */
  partNames: Record<PartKind, string>
  /** "I finished my WHOLE page: a warm-up, ... AND a lightning lap!" */
  wholePage: (parts: string) => string
  /** "I solved 22 of 28 puzzles." A quip is added after it. */
  puzzles: (solved: string) => string
  puzzleQuips: readonly string[]
  lapFirst: (fast: number) => string
  lapRecord: (fast: number) => string
  lapTie: (fast: number) => string
  lapBelow: (fast: number, best: number) => string
  checkupAll: (count: number) => string
  checkupSome: (right: number, asked: number) => string
  perfect: readonly string[]
  tough: readonly string[]
  /** Facts that reached sparkly today, already listed ("5 × 7, 11 × 4, and 3 more"). */
  mastered: (facts: string) => string
  /** A fact missed and then fixed today. */
  fixed: (fact: string) => string
  /** Tables placed in one go because she already knew them ("2s and 5s"). */
  placed: (tables: string) => string
  metOne: (fact: string) => string
  metMany: (count: number) => string
  streak: (days: number) => string
  closers: readonly string[]
}

/** The original voice: a dramatic, first-person diary. */
export const DIARY_VOICE: Voice = {
  openers: [
    'OMG! You will NOT believe what happened today.',
    "Okay, so here's what happened.",
    'I have BIG news.',
    "Today was kind of AMAZING. Here's why.",
    'Math time again! And guess what?',
    'So. Much. Math. But in a good way!',
  ],
  did: (count, time, fast) => `I did ${count} times table facts in ${time}${fast === null ? '' : `, and ${fast} were SUPER fast`}.`,
  partNames: {
    warmup: 'a warm-up',
    new: 'new facts',
    mixed: 'practice',
    puzzles: 'puzzles',
    lightning: 'a lightning lap',
    bonus: 'a bonus round',
  },
  wholePage: (parts) => `I finished my WHOLE page: ${parts}!`,
  puzzles: (solved) => `I solved ${solved} puzzles.`,
  puzzleQuips: ['Division is just times tables backwards. Who knew?!', 'Missing numbers cannot hide from me.'],
  lapFirst: (fast) => `My first lightning lap: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Lightning lap: ${fast} SUPER fast. NEW RECORD!!!`,
  lapTie: (fast) => `Lightning lap: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Lightning lap: ${fast} SUPER fast. My record is ${best}. I'm coming for it!`,
  checkupAll: (count) => `Check-up day! I still knew ALL ${count} of my sparkly facts. My brain is basically a vault.`,
  checkupSome: (right, asked) => `Check-up day! I still knew ${right} of my ${asked} sparkly facts. The others are back in practice.`,
  perfect: ['I got EVERY SINGLE ONE right on the first try. Is this even real life?!', 'Zero mistakes. ZERO! I might frame this page.'],
  tough: [
    'Some facts were super tricky today. But tricky facts make brains stronger!',
    'Okay, today was HARD. But I kept going, and that counts. A lot.',
  ],
  mastered: (facts) => `${facts} got sparkles on my doodle page. SQUEEE!!!`,
  fixed: (fact) => `${fact} tried to trick me, but I figured it out. Take THAT, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so they got inked on my doodle page. Obviously.`,
  metOne: (fact) => `I met a new fact: ${fact}. Nice to meet you!`,
  metMany: (count) => `I met ${count} new facts. My brain is basically growing as we speak.`,
  streak: (days) => `That's ${days} diary days in a row. I am UNSTOPPABLE.`,
  closers: [
    'Okay, gotta go. More tomorrow!',
    'That is all for now. Math genius, signing off!',
    'Until tomorrow, Diary!',
    "SQUEEE!!! (That's my happy noise.)",
    'Time for a snack. Brains need snacks.',
  ],
}
