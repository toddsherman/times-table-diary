import { dateFromDay } from '../engine/dates'
import type { DiaryEntry } from '../engine/types'
import { Sticker } from './Sticker'

export function DiaryPage({ entry, name, withSticker = false }: { entry: DiaryEntry; name: string; withSticker?: boolean }) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className={`card page tape ${withSticker ? 'with-sticker' : ''}`}>
      <p className="page-date">{date}</p>
      <h2 className="dear">Dear Diary,</h2>
      {entry.lines.map((line, i) => (
        <p key={i} className="entry-line">
          {line}
        </p>
      ))}
      <p className="signature">— {name}</p>
      {withSticker && <Sticker id={entry.sticker} size={72} className="page-sticker" />}
    </article>
  )
}
