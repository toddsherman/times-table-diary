import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Burst } from '../components/Burst'
import { DotArray } from '../components/DotArray'
import { CloseIcon } from '../components/Icons'
import { Keypad, type Key } from '../components/Keypad'
import { PagePlan, PartDots } from '../components/PagePlan'
import { Sticker } from '../components/Sticker'
import { dayNumber } from '../engine/dates'
import { addTime, beginPart, endPart, finishPage, logDay, pageDone, PARTS, showQuestion, startToday } from '../engine/day'
import { puzzleHint, strategyHint } from '../engine/facts'
import { nextQuestion, partAsked, recordAnswer } from '../engine/session'
import type { DayPlan, DiaryEntry, Level, Outcome, PartPlan, Progress, Question } from '../engine/types'
import { sfx } from '../sound'
import { awardSticker } from '../stickers'
import { queueAnswer, saveProgress } from '../storage'

const FAST_CHEERS = ['SQUEEE!', 'OMG, YES!', 'Genius!', 'Nailed it!', 'So fab!', 'Boom!', 'Math star!', 'Too easy!']
const OK_CHEERS = ['Got it!', 'Yes!', 'Correct!', 'You got it!']
const BREAK_IDEAS = ['Stretch break! Reach for the sky.', 'Wiggle your fingers. Ready?', 'Shake out your arms!', 'Sip of water?', 'Big breath in… and out.']
const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)]

interface Props {
  progress: Progress
  /** Stop for now: everything is saved, and the page picks up from here next time. */
  onBreak: (p: Progress) => void
  /** The last part of today's page is done and its diary page is written. */
  onPageDone: (p: Progress, entry: DiaryEntry) => void
}

interface View {
  q: Question | null
  typed: string
  mode: 'ask' | 'fix'
  gaveUp: boolean
  cheer: { text: string; big: boolean } | null
  shakes: number
  quitting: boolean
  /** The part just finished, while the between-parts screen is up. */
  finished: PartPlan | null
}

/** The question, with the answer box wherever the missing number goes. */
function Problem({ q, slot }: { q: Question; slot: ReactNode }) {
  const product = q.a * q.b
  switch (q.form) {
    case 'divide':
      return (
        <>
          <span>
            {product} ÷ {q.a} =
          </span>
          {slot}
        </>
      )
    case 'missing-a':
      return (
        <>
          {slot}
          <span>
            × {q.b} = {product}
          </span>
        </>
      )
    case 'missing-b':
      return (
        <>
          <span>{q.a} ×</span>
          {slot}
          <span>= {product}</span>
        </>
      )
    default:
      return (
        <>
          <span>
            {q.a} × {q.b} =
          </span>
          {slot}
        </>
      )
  }
}

export function Practice({ progress, onBreak, onPageDone }: Props) {
  // The engine mutates these copies. They're set up together in one initializer so StrictMode's
  // double call can't leave the first question and the plan out of sync.
  const [{ p, plan, first }] = useState(() => {
    const p = structuredClone(progress)
    const plan = startToday(p, dayNumber(), Date.now())
    beginPart(p, plan)
    // Reopening mid-part asks the question that was on screen, rather than skipping it.
    const first = plan.pending ?? nextQuestion(p, plan.session)
    showQuestion(plan, first)
    return { p, plan, first }
  })
  const s = plan.session
  const [view, setView] = useState<View>({
    q: first,
    typed: '',
    mode: 'ask',
    gaveUp: false,
    cheer: null,
    shakes: 0,
    quitting: false,
    finished: null,
  })
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

  const save = () => {
    logDay(p, plan)
    saveProgress(p)
  }

  function finishPart(): void {
    const now = Date.now()
    const part = endPart(p, plan, now)
    if (part.kind !== 'bonus' && pageDone(plan) && !plan.finished) {
      const entry = finishPage(p, plan, awardSticker(p.stickers), now)
      saveProgress(p)
      onPageDone(p, entry)
      return
    }
    // A part that had nothing to ask (say, nothing new left to learn today) is skipped quietly.
    if (part.asked === 0 && plan.current < plan.parts.length) {
      startNextPart()
      return
    }
    saveProgress(p)
    sfx.fanfare()
    update({ q: null, cheer: null, mode: 'ask', typed: '', finished: part })
  }

  // If the part had nothing to ask from the start, move on. The ref keeps StrictMode's
  // double effect from ending the part twice.
  const skippedEmpty = useRef(false)
  useEffect(() => {
    if (first || skippedEmpty.current) return
    skippedEmpty.current = true
    finishPart()
  })

  function startNextPart(): void {
    beginPart(p, plan)
    const next = nextQuestion(p, s)
    if (!next) {
      finishPart()
      return
    }
    showQuestion(plan, next)
    saveProgress(p)
    shownAt.current = performance.now()
    update({ q: next, typed: '', mode: 'ask', gaveUp: false, cheer: null, finished: null })
  }

  // Every first-try, re-ask, puzzle, and "show me" goes to the answer log for the progress report.
  const log = (q: Question, given: number | null, ms: number, outcome: Outcome, before: Level) =>
    queueAnswer({
      at: Date.now(),
      day: s.day,
      fact: q.id,
      given,
      correct: outcome !== 'wrong',
      ms: Math.round(ms),
      kind: q.kind,
      form: q.form,
      outcome,
      before,
      after: p.facts[q.id].level,
    })

  const advance = () => {
    // A question's time runs from when it appears to when the next one does, cheer and fix-up included.
    addTime(plan, performance.now() - shownAt.current)
    const next = nextQuestion(p, s)
    if (!next) return finishPart()
    showQuestion(plan, next)
    save()
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
    save()
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
    save()
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

  const { q, typed, mode, gaveUp, cheer, shakes, quitting, finished } = view
  if (finished) return <BetweenParts plan={plan} part={finished} onNext={startNextPart} onBreak={() => onBreak(p)} />
  if (!q) return null

  const covered = mode === 'fix' && typed.length > 0 && !cheer
  const kind = s.part.kind
  const done = partAsked(s)
  const length = s.part.length
  const box = (
    <span className="answer-box">
      {typed}
      {!cheer && <span className="caret" />}
    </span>
  )
  const hint = q.form === 'times' ? strategyHint(q.a, q.b) : puzzleHint(q.a, q.b, q.form)

  return (
    <div className="screen practice">
      <header className="practice-top">
        <button type="button" className="icon-btn" aria-label="Take a break" onClick={() => update({ quitting: true })}>
          <CloseIcon />
        </button>
        <div className="part-label">
          <span className="part-name">{PARTS[kind].title}</span>
          <PartDots plan={plan} />
        </div>
        <div className="pencil-bar" role="progressbar" aria-valuemin={0} aria-valuemax={length} aria-valuenow={Math.min(done, length)}>
          <div className="pencil-fill" style={{ width: `${Math.min(100, (done / length) * 100)}%` }} />
        </div>
        {kind === 'lightning' && (
          <span className="fast-count" aria-label={`${s.part.fast} super fast so far`}>
            <Sticker id="bolt" size={30} /> {s.part.fast}
          </span>
        )}
        <span className="count">{done > length ? 'Fix-ups!' : `${done} of ${length}`}</span>
      </header>

      <main className="practice-main">
        <section className="q-card tape">
          {mode === 'ask' && q.kind === 'checkup' && <p className="stamp-tag">Check-up!</p>}
          {mode === 'ask' && q.kind === 'new' && <p className="stamp-tag new">New!</p>}
          {mode === 'ask' ? (
            <>
              <p className="problem" key={s.asked}>
                <Problem q={q} slot={box} />
              </p>
              <button type="button" className="show-me" onClick={showMe}>
                Show me how
              </button>
            </>
          ) : (
            <div className="fix">
              <p className="fix-title">{gaveUp ? "Here's a trick!" : 'Oops! Almost.'}</p>
              <p className="problem small">
                <Problem q={q} slot={<span className="reveal">{covered ? '?' : q.answer}</span>} />
              </p>
              <p className={`hint ${covered ? 'covered' : ''}`}>{covered ? 'No peeking!' : hint}</p>
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
            <h2 id="quit-title">Take a break?</h2>
            <p>Everything is saved. Come back any time today to finish your page.</p>
            <div className="dialog-buttons">
              <button type="button" className="btn" onClick={() => update({ quitting: false })}>
                Keep going
              </button>
              <button type="button" className="btn pink" onClick={() => onBreak(p)}>
                Take a break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function partSummary(part: PartPlan, plan: DayPlan): string {
  if (part.kind === 'lightning') {
    const record = plan.bestBefore > 0 && part.fast > plan.bestBefore ? ' NEW RECORD!' : ''
    return `${part.fast} of ${part.firstTry} super fast!${record}`
  }
  if (part.kind === 'puzzles') return `${part.right} of ${part.firstTry} puzzles solved on the first try`
  return `${part.right} of ${part.firstTry} right on the first try`
}

/** The pause between parts: what she just did, what's next, and the choice to keep going or rest. */
function BetweenParts({ plan, part, onNext, onBreak }: { plan: DayPlan; part: PartPlan; onNext: () => void; onBreak: () => void }) {
  const [idea] = useState(() => pick(BREAK_IDEAS))
  const next = plan.parts[plan.current]
  return (
    <div className="screen between">
      <h1 className="bubble-title small">{PARTS[part.kind].title} done!</h1>
      {part.firstTry > 0 && <p className="between-line">{partSummary(part, plan)}</p>}
      <section className="card today-card">
        <PagePlan plan={plan} />
      </section>
      {next ? (
        <>
          <section className="card next-up tape">
            <p className="next-label">Next up</p>
            <h2>{PARTS[next.kind].title}</h2>
            <p>{PARTS[next.kind].intro}</p>
          </section>
          <p className="note break-idea">{idea}</p>
          <div className="dialog-buttons">
            <button type="button" className="btn pink big" onClick={onNext}>
              Let's go!
            </button>
            <button type="button" className="btn" onClick={onBreak}>
              Take a break
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="btn pink big" onClick={onBreak}>
          All done for today
        </button>
      )}
    </div>
  )
}
