import { useEffect, useRef, useState } from 'react'
import { GearIcon } from '../components/Icons'
import { Sticker } from '../components/Sticker'
import { dayNumber } from '../engine/dates'
import { ALL_FACT_IDS } from '../engine/facts'
import { levelCounts, streak } from '../engine/progress'
import type { Progress } from '../engine/types'
import { STICKER_IDS } from '../stickers'

interface Props {
  progress: Progress
  onStart: () => void
  onDoodles: () => void
  onDiary: () => void
  onSettings: () => void
}

export function Home({ progress, onStart, onDoodles, onDiary, onSettings }: Props) {
  const today = dayNumber()
  const days = streak(progress.entries, today)
  const wroteToday = progress.entries.some((e) => e.day === today)
  const counts = levelCounts(progress)
  // Colored in or better. Strict mastery takes several days, and "0 mastered" on day one is no fun.
  const coloredIn = counts[3] + counts[4] + counts[5]
  const collected = STICKER_IDS.filter((id) => progress.stickers.includes(id))

  return (
    <div className="screen home">
      <GrownUpsButton onOpen={onSettings} />
      <header className="home-title">
        <p className="owner">{progress.name}'s</p>
        <h1 className="bubble-title">Times Table Diary</h1>
        <p className="tagline">Tales from a Not-So-Secret Math Genius</p>
      </header>

      <div className="stickies">
        <div className="sticky">
          <b>{coloredIn}</b>of {ALL_FACT_IDS.length} facts colored in
        </div>
        <div className="sticky pink">
          <b>{days}</b>
          {days === 1 ? 'diary day' : 'diary days'} in a row
        </div>
        <div className="sticky teal">
          <b>{collected.length}</b>of {STICKER_IDS.length} stickers
        </div>
      </div>

      <div className="level-bar" title="Your doodle page so far">
        {[5, 4, 3, 2, 1].map((level) => (counts[level] > 0 ? <span key={level} className={`b${level}`} style={{ flexGrow: counts[level] }} /> : null))}
        <span style={{ flexGrow: counts[0] }} />
      </div>

      <button type="button" className="btn pink big" onClick={onStart}>
        {wroteToday ? 'Write a bonus entry' : "Write today's entry"}
      </button>

      <div className="home-links">
        <button type="button" className="btn teal" onClick={onDoodles}>
          My doodle page
        </button>
        <button type="button" className="btn purple" onClick={onDiary}>
          Read my diary
        </button>
      </div>

      {collected.length > 0 && (
        <section className="sticker-shelf" aria-label="Your stickers">
          {collected.map((id) => (
            <Sticker key={id} id={id} size={60} />
          ))}
        </section>
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
