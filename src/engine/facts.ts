export const MAX_FACTOR = 12
export const FACTORS: number[] = Array.from({ length: MAX_FACTOR }, (_, i) => i + 1)

export interface Fact {
  id: string
  a: number
  b: number
  answer: number
}

export function factId(a: number, b: number): string {
  return `${a}x${b}`
}

export function parseFact(id: string): Fact {
  const [a, b] = id.split('x').map(Number)
  return { id, a, b, answer: a * b }
}

/** "7 × 8" with non-breaking spaces, so a fact never wraps across lines. */
export function showFact(id: string): string {
  const { a, b } = parseFact(id)
  return `${a}\u00a0×\u00a0${b}`
}

export const ALL_FACT_IDS: string[] = FACTORS.flatMap((a) => FACTORS.map((b) => factId(a, b)))

/** The turnaround pair a fact belongs to: 3x8 and 8x3 are both "3x8". */
export function familyOf(id: string): string {
  const { a, b } = parseFact(id)
  return a <= b ? factId(a, b) : factId(b, a)
}

// Factors in the order their strategies get taught.
const PRIORITY = [1, 10, 2, 5, 11, 9, 4, 3, 12, 6, 7, 8]
const STAGE_OF: Record<number, number> = { 1: 1, 10: 1, 2: 2, 5: 2, 11: 3, 9: 3, 4: 4, 3: 4, 12: 4, 6: 5, 7: 5, 8: 5 }

export const STAGE_NAMES = ['Rules', 'Doubles and fives', 'Pattern tricks', 'Build from known', 'The final six']

/** Splits a fact into the factor whose strategy unlocks it and the other factor. */
export function helperOf(a: number, b: number): [helper: number, other: number] {
  return PRIORITY.indexOf(a) <= PRIORITY.indexOf(b) ? [a, b] : [b, a]
}

/** 1 = ×1/×10 rules … 5 = the final six (6s, 7s and 8s with each other). */
export function stageOf(a: number, b: number): number {
  return STAGE_OF[helperOf(a, b)[0]]
}

/**
 * Every fact in teaching order: by strategy stage, one table at a time,
 * with each fact's turnaround right behind it.
 */
export const INTRO_ORDER: string[] = (() => {
  const families: Array<[number, number]> = []
  for (const a of FACTORS) for (const b of FACTORS) if (a <= b) families.push(helperOf(a, b))
  families.sort(([h1, o1], [h2, o2]) => STAGE_OF[h1] - STAGE_OF[h2] || PRIORITY.indexOf(h1) - PRIORITY.indexOf(h2) || o1 - o2)
  return families.flatMap(([h, o]) => (h === o ? [factId(h, o)] : [factId(h, o), factId(o, h)]))
})()

const FINAL_SIX: Record<string, string> = {
  '6x6': 'Five 6s is 30, plus one more 6 = 36',
  '6x7': 'Five 7s is 35, plus one more 7 = 42',
  '6x8': 'Five 8s is 40, plus one more 8 = 48',
  '7x7': 'Five 7s is 35, plus two more 7s = 49',
  '7x8': 'Remember 5, 6, 7, 8: 7 × 8 = 56',
  '8x8': 'Double 8 three times: 16, 32, 64',
}

/** A kid-sized way to work the fact out. Always ends with the answer. */
export function strategyHint(a: number, b: number): string {
  const [h, o] = helperOf(a, b)
  const p = a * b
  switch (h) {
    case 1:
      return `Anything times 1 stays the same: ${p}`
    case 10:
      return `Times 10? Put a zero on the end: ${o} → ${p}`
    case 2:
      return `Double it! ${o} + ${o} = ${p}`
    case 5:
      return `Ten ${o}s is ${10 * o}. Half of that is ${p}`
    case 11:
      return o < 10 ? `11 × ${o}? Say the ${o} twice: ${p}` : `Ten ${o}s is ${10 * o}, plus one more ${o} = ${p}`
    case 9:
      return `Ten ${o}s is ${10 * o}. Take away one ${o}: ${p}`
    case 4:
      return `Double, then double again: ${o} → ${2 * o} → ${p}`
    case 3:
      return `Double ${o} is ${2 * o}, plus one more ${o} = ${p}`
    case 12:
      return `Ten ${o}s is ${10 * o}, plus two ${o}s (${2 * o}) = ${p}`
    default:
      return FINAL_SIX[familyOf(factId(a, b))]
  }
}
