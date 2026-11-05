import { dateFromDay } from '../../engine/dates'
import type { StickerId } from '../../stickers'
import type { PageProps } from '../types'
import { NinjaReward } from './art'

/** An entry as a training scroll: wooden rollers, the day's notes, and a red name seal. */
export function ScrollPage({ entry, name, number, withSticker = false }: PageProps) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className={`ninja-scroll ${withSticker ? 'with-sticker' : ''}`}>
      <div className="ninja-roller" aria-hidden="true" />
      <div className="ninja-scroll-paper">
        <header className="ninja-scroll-head">
          <h2 className="ninja-scroll-title">Training scroll</h2>
          <p className="ninja-scroll-day">
            Day {number} · {date}
          </p>
        </header>
        {entry.lines.map((line, i) => (
          <p key={i} className="entry-line">
            {line}
          </p>
        ))}
        <p className="ninja-seal" aria-label={`Signed, ${name}`}>
          {name}
        </p>
        {withSticker && <NinjaReward id={entry.sticker as StickerId} size={72} className="ninja-scroll-sticker" />}
      </div>
      <div className="ninja-roller" aria-hidden="true" />
    </article>
  )
}
