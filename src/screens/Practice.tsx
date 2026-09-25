import { useEffect, useRef, useState } from 'react'
import { Burst } from '../components/Burst'
import { DotArray } from '../components/DotArray'
import { CloseIcon } from '../components/Icons'
import { Keypad, type Key } from '../components/Keypad'
import { dayNumber } from '../engine/dates'
import { writeEntry } from '../engine/diary'
import { strategyHint } from '../engine/facts'
import { masteredCount, streak } from '../engine/progress'
import { createSession, finishCheckup, nextQuestion, planCheckup, recordAnswer } from '../engine/session'
import type { DiaryEntry, Level, Outcome, Progress, Question } from '../engine/types'
import { sfx } from '../sound'
import { awardSticker } from '../stickers'
import { queueAnswer, saveProgress } from '../storage'

const FAST_CHEERS = ['SQUEEE!', 'OMG, YES!', 'Genius!', 'Nailed it!', 'So fab!', 'Boom!', 'Math star!', 'Too easy!']
const OK_CHEERS = ['Got it!', 'Yes!', 'Correct!', 'You got it!']
const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)]

interface Props {
  progress: Progress
  onQuit: (p: Progress) => void
  onFinish: (p: Progress, entry: DiaryEntry) => void
}

interface View {
  q: Question | null
  typed: string
  mode: 'ask' | 'fix'
  gaveUp: boolean
  cheer: { text: string; big: boolean } | null
  shakes: number
  quitting: boolean
}

export function Practice({ progress, onQuit, onFinish }: Props) {
  // The engine mutates these copies. They're created together in one initializer so
  // StrictMode's double call can't leave the first question and the session out of sync.
  const [{ p, s, first }] = useState(() => {
    const p = structuredClone(progress)
    const day = dayNumber()
    const s = createSession(p.settings.sessionLength, day, Date.now(), planCheckup(p, day))
    return { p, s, first: nextQuestion(p, s) }
  })
  const [view, setView] = useState<View>({ q: first, typed: '', mode: 'ask', gaveUp: false, cheer: null, shakes: 0, quitting: false })
  // Handlers read and write the latest view through this ref, so taps or key presses that land
  // before React re-renders never act on a stale question or a half-typed answer.
  const live = useRef(view)
  const update = (patch: Partial<View>) => {
    live.current = { ...live.current, ...patch }
    setView(live.current)
  }
  const shownAt = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const keyHandler = useRef<(key: Key) => void>(() => {})

  const finish = () => {
    const now = Date.now()
    finishCheckup(p, s, now)
    const sticker = awardSticker(p.stickers)
    p.stickers.push(sticker)
    const streakDays = streak([...p.entries, { day: s.day }], s.day)
    const entry = writeEntry(s, { streakDays, sticker, now, mastered: masteredCount(p) })
    p.entries.push(entry)
    saveProgress(p)
    onFinish(p, entry)
  }

  // Every first-try, re-ask, and "show me" goes to the answer log for the progress report.
  const log = (q: Question, given: number | null, ms: number, outcome: Outcome, before: Level) =>
    queueAnswer({
      at: Date.now(),
      day: s.day,
      fact: q.id,
      given,
      correct: outcome !== 'wrong',
      ms: Math.round(ms),
      kind: q.kind,
      outcome,
      before,
      after: p.facts[q.id].level,
    })

  const advance = () => {
    const next = nextQuestion(p, s)
    if (!next) return finish()
    shownAt.current = performance.now()
    update({ q: next, typed: '', mode: 'ask', gaveUp: false, cheer: null })
  }

  const celebrate = (text: string, big: boolean, delay: number) => {
    update({ cheer: { text, big } })
    timer.current = window.setTimeout(advance, delay)
  }

  const submit = (q: Question, value: string) => {
    const ms = Math.min(performance.now() - shownAt.current, 30_000)
    const before = p.facts[q.id].level
    const outcome = recordAnswer(p, s, q, Number(value) === q.answer, ms)
    saveProgress(p)
    log(q, Number(value), ms, outcome, before)
    if (outcome === 'wrong') {
      sfx.wrong()
      update({ mode: 'fix', typed: '' })
      return
    }
    if (outcome === 'fast') sfx.fast()
    else sfx.correct()
    celebrate(pick(outcome === 'fast' ? FAST_CHEERS : OK_CHEERS), outcome === 'fast', outcome === 'fast' ? 650 : 750)
  }

  // After a miss she copies the answer from memory (it gets covered as soon as she starts typing).
  const checkCopy = (q: Question, value: string) => {
    if (Number(value) === q.answer) {
      sfx.correct()
      celebrate('Now you know it!', false, 900)
    } else {
      sfx.wrong()
      update({ typed: '', shakes: live.current.shakes + 1 })
    }
  }

  const showMe = () => {
    const { q, mode, cheer } = live.current
    if (!q || mode !== 'ask' || cheer) return
    const ms = performance.now() - shownAt.current
    const before = p.facts[q.id].level
    recordAnswer(p, s, q, false, ms)
    saveProgress(p)
    log(q, null, ms, 'wrong', before)
    update({ gaveUp: true, mode: 'fix', typed: '' })
  }

  const onKey = (key: Key) => {
    const { q, typed, mode, cheer, quitting } = live.current
    if (!q || cheer || quitting) return
    const check = mode === 'ask' ? submit : checkCopy
    if (key === 'back') return update({ typed: typed.slice(0, -1) })
    if (key === 'go') {
      if (typed) check(q, typed)
      return
    }
    if (typed.length >= 3) return
    const next = typed + key
    update({ typed: next })
    if (next.length >= String(q.answer).length) check(q, next)
  }

  useEffect(() => {
    keyHandler.current = onKey
  })

  useEffect(() => {
    shownAt.current = performance.now()
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) keyHandler.current(e.key as Key)
      else if (e.key === 'Backspace') keyHandler.current('back')
      else if (e.key === 'Enter') keyHandler.current('go')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const { q, typed, mode, gaveUp, cheer, shakes, quitting } = view
  if (!q) return null
  const covered = mode === 'fix' && typed.length > 0 && !cheer

  return (
    <div className="screen practice">
      <header className="practice-top">
        <button type="button" className="icon-btn" aria-label="Stop for today" onClick={() => update({ quitting: true })}>
          <CloseIcon />
        </button>
        <div className="pencil-bar" role="progressbar" aria-valuemin={0} aria-valuemax={s.length} aria-valuenow={Math.min(s.asked, s.length)}>
          <div className="pencil-fill" style={{ width: `${Math.min(100, (s.asked / s.length) * 100)}%` }} />
        </div>
        <span className="count">{s.asked > s.length ? 'Fix-ups!' : `${s.asked} of ${s.length}`}</span>
      </header>

      <main className="practice-main">
        <section className="q-card tape">
          {q.kind === 'checkup' && mode === 'ask' && <p className="checkup-stamp">Check-up!</p>}
          {mode === 'ask' ? (
            <>
              <p className="problem" key={s.asked}>
                <span>
                  {q.a} × {q.b} =
                </span>
                <span className="answer-box">
                  {typed}
                  {!cheer && <span className="caret" />}
                </span>
              </p>
              <button type="button" className="show-me" onClick={showMe}>
                Show me how
              </button>
            </>
          ) : (
            <div className="fix">
              <p className="fix-title">{gaveUp ? "Here's a trick!" : 'Oops! Almost.'}</p>
              <p className="problem small">
                <span>
                  {q.a} × {q.b} =
                </span>
                <span className="reveal">{covered ? '?' : q.answer}</span>
              </p>
              <p className={`hint ${covered ? 'covered' : ''}`}>{covered ? 'No peeking!' : strategyHint(q.a, q.b)}</p>
              <DotArray rows={q.a} cols={q.b} />
              <p className="copy-row">
                <span>Now you type it:</span>
                <span key={shakes} className={`answer-box ${shakes > 0 ? 'shake' : ''}`}>
                  {typed}
                  {!cheer && <span className="caret" />}
                </span>
              </p>
            </div>
          )}
          {cheer && <Burst key={`${s.asked}-${cheer.text}`} text={cheer.text} big={cheer.big} />}
        </section>
      </main>

      <Keypad onKey={onKey} />

      {quitting && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <div className="dialog card tape">
            <h2 id="quit-title">Stop today's entry?</h2>
            <p>Your answers are saved, but you only get a diary page and a sticker if you finish.</p>
            <div className="dialog-buttons">
              <button type="button" className="btn" onClick={() => update({ quitting: false })}>
                Keep going
              </button>
              <button type="button" className="btn pink" onClick={() => onQuit(p)}>
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
