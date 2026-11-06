import { dateFromDay } from '../../engine/dates'
import type { StickerId } from '../../stickers'
import type { PageProps } from '../types'
import { Gear } from './art'
import { REWARD_NAMES } from './palette'

/** An entry as a sports-page clipping: masthead, the box score on a scoreboard, then the story. */
export function GameRecap({ entry, name, number, withSticker = false }: PageProps) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const [headline, ...story] = entry.lines
  const { stats } = entry
  const sticker = entry.sticker as StickerId
  return (
    <article className={`card page bb-recap ${withSticker ? 'with-sticker' : ''}`}>
      <header className="bb-recap-mast">
        <p className="bb-recap-paper">The Hoops Herald</p>
        <p className="bb-recap-edition">
          <span>Game {number}</span>
          <span className="page-date">{date}</span>
        </p>
      </header>
      <dl className="bb-recap-board" aria-label="Box score">
        <div>
          <dd>{stats.right}</dd>
          <dt>shots made</dt>
        </div>
        <div>
          <dd>{stats.fast}</dd>
          <dt>super fast</dt>
        </div>
        <div>
          <dd>{stats.minutes}</dd>
          <dt>minutes</dt>
        </div>
      </dl>
      <div className="bb-recap-story">
        {withSticker && (
          <figure className="bb-recap-photo">
            <Gear id={sticker} size={84} className="page-sticker" />
            <figcaption>{REWARD_NAMES[sticker]}</figcaption>
          </figure>
        )}
        <h2 className="dear bb-recap-headline">{headline}</h2>
        <p className="bb-recap-byline">By {name}, team captain</p>
        {story.map((line, i) => (
          <p key={i} className="entry-line">
            {line}
          </p>
        ))}
      </div>
    </article>
  )
}
