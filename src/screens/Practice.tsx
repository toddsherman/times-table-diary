import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Burst } from '../components/Burst'
import { DotArray } from '../components/DotArray'
import { CloseIcon } from '../components/Icons'
import { Keypad, type Key } from '../components/Keypad'
import { PagePlan, PartDots } from '../components/PagePlan'
import { dayNumber } from '../engine/dates'
import { addTime, beginPart, endPart, finishPage, logDay, pageDone, showQuestion, startToday } from '../engine/day'
import { puzzleHint, strategyHint } from '../engine/facts'
import { nextQuestion, partAsked, recordAnswer } from '../engine/session'
import type { DayPlan, DiaryEntry, Level, Outcome, PartPlan, Progress, Question } from '../engine/types'
import { sfx } from '../sound'
import { awardSticker } from '../stickers'
import { queueAnswer, saveProgress } from '../storage'
import { useTheme } from '../themes'
import type { Milestone } from '../themes/types'

const pick = (xs: readonly string[]) => xs[Math.floor(Math.random() * xs.length)]
/** Fewest answers between two milestone pop-ups. Milestones in between wait and show up together. */
const MILESTONE_GAP = 8

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
  /** Milestones on screen together (a creature evolving, say). */
  milestones: Milestone[]
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
  const theme = useTheme()
  const { words, parts: PARTS, FastIcon } = theme
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
    milestones: [],
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
  // Milestones already reached when practice opened, so only new ones are celebrated.
  const reached = useRef<Set<string> | null>(null)
  reached.current ??= new Set(theme.milestones?.(p).map((m) => m.key))

  /** Milestones reached since the last check. They go in today's entry too. */
  const newMilestones = (): Milestone[] => {
    if (!theme.milestones || !reached.current) return []
    const fresh = theme.milestones(p).filter((m) => !reached.current?.has(m.key))
    for (const m of fresh) reached.current.add(m.key)
    if (fresh.length > 0) plan.events = [...(plan.events ?? []), ...fresh.map((m) => m.entryLine)]
    return fresh
  }

  // Milestones reached but not shown yet, the answer count when the last pop-up showed, and what
  // closing the pop-up does next. Spacing them out keeps a new player's first page (when eggs
  // hatch one after another) from turning into a stream of pop-ups.
  const held = useRef<Milestone[]>([])
  const lastShown = useRef(-Infinity)
  const afterMilestones = useRef<() => void>(() => {})

  /** Shows the held milestones in one pop-up, then carries on with `then`. */
  const showMilestones = (then: () => void) => {
    sfx.fanfare()
    lastShown.current = s.asked
    afterMilestones.current = then
    const shown = held.current
    held.current = []
    update({ cheer: null, milestones: shown })
  }

  const save = () => {
    logDay(p, plan)
    saveProgress(p)
  }

  function finishPart(): void {
    // Anything still held is shown before the part wraps up.
    if (held.current.length > 0) return showMilestones(finishPart)
    const now = Date.now()
    const part = endPart(p, plan, now)
    if (part.kind !== 'bonus' && pageDone(plan) && !plan.finished) {
      const entry = finishPage(p, plan, awardSticker(p.stickers), now, Math.random, theme.voice)
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
    timer.current = window.setTimeout(() => {
      if (held.current.length > 0 && s.asked - lastShown.current >= MILESTONE_GAP) return showMilestones(advance)
      advance()
    }, delay)
  }

  const closeMilestones = () => {
    update({ milestones: [] })
    afterMilestones.current()
  }

  const submit = (q: Question, value: string) => {
    const ms = Math.min(performance.now() - shownAt.current, 30_000)
    const before = p.facts[q.id].level
    const outcome = recordAnswer(p, s, q, Number(value) === q.answer, ms)
    if (outcome !== 'wrong') held.current.push(...newMilestones())
    save()
    log(q, Number(value), ms, outcome, before)
    if (outcome === 'wrong') {
      sfx.wrong()
      update({ mode: 'fix', typed: '' })
      return
    }
    if (outcome === 'fast') sfx.fast()
    else sfx.correct()
    celebrate(pick(outcome === 'fast' ? words.fastCheers : words.okCheers), outcome === 'fast', outcome === 'fast' ? 650 : 750)
  }

  // After a miss she copies the answer from memory (it gets covered as soon as she starts typing).
  const checkCopy = (q: Question, value: string) => {
    if (Number(value) === q.answer) {
      sfx.correct()
      celebrate(words.copied, false, 900)
    } else {
      sfx.wrong()
      update({ typed: '', shakes: live.current.shakes + 1 })
    }
  }

  const showMe = () => {
    const { q, mode, cheer, milestones } = live.current
    if (!q || mode !== 'ask' || cheer || milestones.length > 0) return
    const ms = performance.now() - shownAt.current
    const before = p.facts[q.id].level
    recordAnswer(p, s, q, false, ms)
    save()
    log(q, null, ms, 'wrong', before)
    update({ gaveUp: true, mode: 'fix', typed: '' })
  }

  const onKey = (key: Key) => {
    const { q, typed, mode, cheer, quitting, milestones } = live.current
    if (!q || cheer || quitting || milestones.length > 0) return
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

  const { q, typed, mode, gaveUp, cheer, shakes, quitting, finished, milestones } = view
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
            <FastIcon /> {s.part.fast}
          </span>
        )}
        <span className="count">{done > length ? 'Fix-ups!' : `${done} of ${length}`}</span>
      </header>

      <main className="practice-main">
        <section className="q-card tape">
          {mode === 'ask' && q.kind === 'checkup' && <p className="stamp-tag">{words.checkupTag}</p>}
          {mode === 'ask' && q.kind === 'new' && <p className="stamp-tag new">{words.newTag}</p>}
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
              <p className="fix-title">{gaveUp ? words.trick : words.oops}</p>
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
            <h2 id="quit-title">{words.quitTitle}</h2>
            <p>{words.quitText}</p>
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

      {milestones.length > 0 && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="milestone-title">
          <div key={milestones[0].key} className={`dialog card milestone tape ${milestones.length > 1 ? 'many' : ''}`}>
            {milestones.length === 1 ? (
              <>
                <div className="milestone-art">{milestones[0].art}</div>
                <h2 id="milestone-title">{milestones[0].title}</h2>
                <p>{milestones[0].text}</p>
              </>
            ) : (
              <>
                <h2 id="milestone-title">{words.manyMilestones?.(milestones.length) ?? `${milestones.length} big moments!`}</h2>
                <ul className="milestone-list">
                  {milestones.map((m) => (
                    <li key={m.key}>
                      <div className="milestone-art">{m.art}</div>
                      <p>{m.text}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="dialog-buttons">
              <button type="button" className="btn pink big" onClick={closeMilestones}>
                {words.letsGo}
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
  const { words, parts: PARTS } = useTheme()
  const [idea] = useState(() => pick(words.breakIdeas))
  const next = plan.parts[plan.current]
  return (
    <div className="screen between">
      <h1 className="bubble-title small">{words.partDone(PARTS[part.kind].title)}</h1>
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
              {words.letsGo}
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
