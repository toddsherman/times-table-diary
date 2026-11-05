import { dateFromDay } from '../engine/dates'
import type { DiaryEntry } from '../engine/types'
import type { StickerId } from '../stickers'
import { useTheme } from '../themes'
import type { PageProps } from '../themes/types'

/** An entry as the theme draws it: a diary page, a build log, a training scroll… */
export function EntryPage(props: PageProps) {
  const { Page } = useTheme()
  return Page ? <Page {...props} /> : <DiaryPage {...props} />
}

export function DiaryPage({ entry, name, withSticker = false }: { entry: DiaryEntry; name: string; withSticker?: boolean }) {
  const { words, Reward } = useTheme()
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className={`card page tape ${withSticker ? 'with-sticker' : ''}`}>
      <p className="page-date">{date}</p>
      <h2 className="dear">{words.greeting}</h2>
      {entry.lines.map((line, i) => (
        <p key={i} className="entry-line">
          {line}
        </p>
      ))}
      <p className="signature">{words.signature(name)}</p>
      {withSticker && <Reward id={entry.sticker as StickerId} size={72} className="page-sticker" />}
    </article>
  )
}
