import { dateFromDay } from '../../engine/dates'
import type { StickerId } from '../../stickers'
import type { PageProps } from '../types'
import { Machine } from './machines'
import { SITE_NAME } from './words'

/** An entry as a daily site report on a clipboard: a form with the day's work, signed by the site boss. */
export function SiteReport({ entry, name, number, withSticker = false }: PageProps) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className={`card page site-report ${withSticker ? 'with-sticker' : ''}`}>
      <span className="report-clip" aria-hidden="true" />
      <div className="report-paper">
        <header className="report-head">
          <h2 className="dear">Daily site report</h2>
          <p className="report-no">No. {number}</p>
        </header>
        <dl className="report-fields">
          <div>
            <dt>Date</dt>
            <dd className="page-date">{date}</dd>
          </div>
          <div>
            <dt>Site</dt>
            <dd>{SITE_NAME}</dd>
          </div>
        </dl>
        <p className="report-label">Work done</p>
        <ul className="report-lines">
          {entry.lines.map((text, i) => (
            <li key={i} className="entry-line">
              {text}
            </li>
          ))}
        </ul>
        <footer className="report-foot">
          <p className="signature">
            Site boss: <span className="sig-name">{name}</span>
          </p>
          <span className="report-stamp" aria-hidden="true">
            Approved
          </span>
          {withSticker && <Machine id={entry.sticker as StickerId} size={84} className="page-sticker" />}
        </footer>
      </div>
    </article>
  )
}
