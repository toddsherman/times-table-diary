import { describe, expect, it } from 'vitest'
import { createProgress } from './progress'
import { buildReport } from './report'
import { mergeProgress, sameProgress } from './sync'
import type { AnswerRecord, DiaryEntry, Progress } from './types'

const TODAY = 20_000

const entry = (at: number, day: number, sticker: string, mastered?: number): DiaryEntry => ({
  day,
  at,
  lines: ['Dear Diary'],
  sticker,
  stats: { total: 20, firstTry: 20, right: 20, fast: 20, minutes: 4, mastered },
})

function twoDevices(): [Progress, Progress] {
  const base = createProgress('Ava', TODAY)
  return [structuredClone(base), structuredClone(base)]
}

describe('merging two copies of a diary', () => {
  it('keeps practice from both devices', () => {
    const [ipad, phone] = twoDevices()
    Object.assign(ipad.facts['2x3'], { level: 3, seen: 1, right: 1, lastDay: TODAY })
    Object.assign(phone.facts['7x8'], { level: 1, seen: 2, right: 0, lastDay: TODAY })
    ipad.entries.push(entry(1000, TODAY, 'heart'))
    phone.entries.push(entry(2000, TODAY, 'star'))
    const merged = mergeProgress(ipad, phone)
    expect(merged.facts['2x3'].level).toBe(3)
    expect(merged.facts['7x8'].seen).toBe(2)
    expect(merged.entries.map((e) => e.at)).toEqual([1000, 2000])
    expect(merged.stickers).toEqual(['heart', 'star'])
  })

  it('keeps the copy of a fact with more practice behind it', () => {
    const [older, newer] = twoDevices()
    Object.assign(older.facts['6x7'], { level: 4, seen: 5, right: 5, lastDay: TODAY - 7 })
    Object.assign(newer.facts['6x7'], { level: 2, seen: 6, right: 5, lastDay: TODAY })
    expect(mergeProgress(older, newer).facts['6x7']).toMatchObject({ level: 2, seen: 6 })
    expect(mergeProgress(newer, older).facts['6x7']).toMatchObject({ level: 2, seen: 6 })
  })

  it('keeps whichever settings changed last', () => {
    const [ipad, phone] = twoDevices()
    ipad.settings.sessionLength = 30
    ipad.settingsAt = 5000
    phone.settings.sound = false
    phone.settingsAt = 4000
    expect(mergeProgress(phone, ipad).settings).toEqual({ sessionLength: 30, sound: true })
  })

  it('gives the same result either way round, and nothing new when merging a copy with itself', () => {
    const [ipad, phone] = twoDevices()
    ipad.entries.push(entry(1000, TODAY, 'heart'))
    phone.checkups.push({ at: 3000, day: TODAY, asked: 10, right: 9, fast: 8 })
    expect(sameProgress(mergeProgress(ipad, phone), mergeProgress(phone, ipad))).toBe(true)
    expect(sameProgress(mergeProgress(ipad, ipad), ipad)).toBe(true)
  })
})

describe('progress report', () => {
  const answer = (over: Partial<AnswerRecord>): AnswerRecord => ({
    at: 1,
    day: TODAY,
    fact: '7x8',
    given: 56,
    correct: true,
    ms: 1500,
    kind: 'review',
    outcome: 'fast',
    before: 4,
    after: 5,
    ...over,
  })

  it('measures retention from mastered facts coming back for review or check-ups', () => {
    const p = createProgress('Ava', TODAY)
    const answers = [
      answer({ at: 1 }),
      answer({ at: 1 }), // a retried upload: counted once
      answer({ at: 2, kind: 'checkup', correct: false, outcome: 'wrong', after: 2 }),
      answer({ at: 3, kind: 'checkup', outcome: 'slow' }),
      answer({ at: 4, before: 2 }), // not mastered yet
      answer({ at: 5, kind: 'reask' }), // a fix-up, not a test
      answer({ at: 6, day: TODAY - 40 }), // too long ago
    ]
    expect(buildReport(p, answers, TODAY).retention).toEqual({ asked: 3, right: 2, fast: 1 })
  })

  it('tracks mastery by table and over time, and fills a four-week calendar', () => {
    const p = createProgress('Ava', TODAY)
    for (const b of [1, 2, 3]) p.facts[`7x${b}`].level = 4
    p.facts['7x4'].level = 5
    p.entries.push(entry(1, TODAY - 3, 'heart', 1), entry(2, TODAY - 1, 'star', 3), entry(3, TODAY - 1, 'bolt', 4))
    const report = buildReport(p, [], TODAY)
    expect(report.tables[6]).toEqual({ table: 7, mastered: 4 })
    expect(report.masteredByDay).toEqual([
      { day: TODAY - 3, mastered: 1 },
      { day: TODAY - 1, mastered: 4 },
      { day: TODAY, mastered: 4 },
    ])
    expect(report.calendar).toHaveLength(28)
    expect(report.calendar.at(-2)).toEqual({ day: TODAY - 1, entries: 2 })
  })
})
