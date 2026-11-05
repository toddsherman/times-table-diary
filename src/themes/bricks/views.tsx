import { dateFromDay } from '../../engine/dates'
import type { Progress } from '../../engine/types'
import type { StickerId } from '../../stickers'
import { tableColoredIn, tableStage } from '../tables'
import type { PageProps } from '../types'
import { BrickModel, Reward } from './art'
import { BUILDS } from './models'

/** A build for every times table, one layer per fact colored in. */
export function BuildCollection({ progress }: { progress: Progress }) {
  return (
    <section className="bricks-builds" aria-label="Your builds">
      {BUILDS.map((build, i) => {
        const table = i + 1
        const built = tableColoredIn(progress, table)
        const stage = tableStage(progress, table)
        const status = stage === 4 ? 'Gold build!' : built === 12 ? 'Built!' : built === 0 ? 'In the box' : `${built} of 12 layers`
        return (
          <figure key={table} className={`bricks-build ${built === 12 ? 'done' : ''} ${stage === 4 ? 'gold' : ''}`}>
            <BrickModel rows={build.rows} built={built} gold={stage === 4} shine={stage >= 3} label={`${build.name}: ${status}`} />
            <figcaption>
              <span className="bricks-build-name">
                <b>×{table}</b> {build.name}
              </span>
              <span className="bricks-build-status">{status}</span>
            </figcaption>
          </figure>
        )
      })}
    </section>
  )
}

/** A build log entry, laid out like a step in an instruction booklet. */
export function BuildLogPage({ entry, name, number, withSticker = false }: PageProps) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className="card page bricks-page">
      <header className="bricks-page-head">
        <span className="bricks-step" aria-label={`Step ${number}`}>
          {number}
        </span>
        <div className="bricks-page-title">
          <p className="bricks-page-kicker">Build log</p>
          <p className="page-date">{date}</p>
        </div>
        {withSticker && (
          <div className="bricks-callout">
            <span className="bricks-callout-count">1×</span>
            <Reward id={entry.sticker as StickerId} size={64} />
          </div>
        )}
      </header>
      {entry.lines.map((line, i) => (
        <p key={i} className="entry-line">
          {line}
        </p>
      ))}
      <p className="signature">Builder: {name}</p>
    </article>
  )
}
