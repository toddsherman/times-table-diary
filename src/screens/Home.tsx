import { useEffect, useRef, useState } from 'react'
import { GearIcon } from '../components/Icons'
import { PagePlan } from '../components/PagePlan'
import { dayNumber } from '../engine/dates'
import { previewDay } from '../engine/day'
import { ALL_FACT_IDS } from '../engine/facts'
import { levelCounts, streak } from '../engine/progress'
import type { Progress } from '../engine/types'
import { useNewSince } from '../motion'
import { STICKER_IDS } from '../stickers'
import { useTheme } from '../themes'

interface Props {
  progress: Progress
  onStart: () => void
  /** Starts a whole new page once today's is finished. */
  onNewLesson: () => void
  onDoodles: () => void
  onDiary: () => void
  onSettings: () => void
}

export function Home({ progress, onStart, onNewLesson, onDoodles, onDiary, onSettings }: Props) {
  const { words, parts, Reward, HomeShelf } = useTheme()
  const today = dayNumber()
  const days = streak(progress.entries, today)
  const plan = previewDay(progress, today)
  const next = plan.parts[plan.current]
  const started = progress.today?.day === today && (plan.current > 0 || plan.running)
  const start = !next
    ? words.bonusRound
    : plan.finished
      ? words.keepGoingBonus
      : started
        ? words.keepGoing(parts[next.kind].title.toLowerCase())
        : words.startToday
  const lesson = plan.lesson ?? 1
  const counts = levelCounts(progress)
  // Colored in or better. Strict mastery takes several days, and "0 mastered" on day one is no fun.
  const coloredIn = counts[3] + counts[4] + counts[5]
  const collected = STICKER_IDS.filter((id) => progress.stickers.includes(id))
  // A reward that's new since home was last shown lands on the shelf with a little bounce.
  const freshRewards = useNewSince(progress, 'rewards', Object.fromEntries(collected.map((id) => [id, 1])))

  return (
    <div className="screen home">
      <GrownUpsButton onOpen={onSettings} />
      <header className="home-title">
        <p className="owner">{words.owner(progress.name)}</p>
        <h1 className="bubble-title">{words.appTitle}</h1>
        <p className="tagline">{words.tagline}</p>
      </header>

      <div className="stickies">
        <div className="sticky">
          <b>{coloredIn}</b>of {ALL_FACT_IDS.length}
          {` ${words.factsDone}`}
        </div>
        <div className="sticky pink">
          <b>{days}</b>
          {days === 1 ? words.dayNoun : words.dayNounPlural} in a row
        </div>
        <div className="sticky teal">
          <b>{collected.length}</b>of {STICKER_IDS.length}
          {` ${words.rewardsCount}`}
        </div>
      </div>

      <div className="level-bar" title={words.levelBarTitle}>
        {[5, 4, 3, 2, 1].map((level) => (counts[level] > 0 ? <span key={level} className={`b${level}`} style={{ flexGrow: counts[level] }} /> : null))}
        <span style={{ flexGrow: counts[0] }} />
      </div>

      <section className="card today-card tape" aria-labelledby="today-title">
        <h2 id="today-title" className="today-title">
          {plan.finished ? words.todayDone : words.todayTitle}
        </h2>
        {lesson > 1 && <p className="lesson-note">{words.lessonNumber(lesson)}</p>}
        <PagePlan plan={plan} />
        {!plan.finished && next && <p className="next-intro">{parts[next.kind].intro}</p>}
      </section>

      {plan.finished ? (
        // Once today's page is done: a bonus round, or a whole new lesson.
        <div className="home-actions">
          <button type="button" className="btn big" onClick={onStart}>
            {start}
          </button>
          <button type="button" className="btn big pink" onClick={onNewLesson}>
            {words.newLesson}
          </button>
        </div>
      ) : (
        <button type="button" className="btn big pink" onClick={onStart}>
          {start}
        </button>
      )}

      <div className="home-links">
        <button type="button" className="btn teal" onClick={onDoodles}>
          {words.gridButton}
        </button>
        <button type="button" className="btn purple" onClick={onDiary}>
          {words.bookButton}
        </button>
      </div>

      {HomeShelf ? (
        <HomeShelf progress={progress} />
      ) : (
        collected.length > 0 && (
          <section className="sticker-shelf" aria-label={words.shelfLabel} data-tap-each="">
            {collected.map((id) => (
              <Reward key={id} id={id} size={60} className={freshRewards.has(id) ? 'fresh' : ''} />
            ))}
          </section>
        )
      )}
    </div>
  )
}

/** Settings open on a long press, so curious fingers don't wander in. */
function GrownUpsButton({ onOpen }: { onOpen: () => void }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const start = () => {
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      onOpen()
    }, 1200)
  }
  const stop = () => {
    setHolding(false)
    window.clearTimeout(timer.current)
  }

  return (
    <button
      type="button"
      className={`grownups ${holding ? 'holding' : ''}`}
      aria-label="Grown-ups: press and hold for settings"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0) onOpen()
      }}
    >
      <GearIcon />
      <span>Grown-ups: hold</span>
    </button>
  )
}
