import type { CSSProperties } from 'react'
import { dateFromDay } from '../../engine/dates'
import { factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import { useNewSince } from '../../motion'
import { STICKER_IDS, type StickerId } from '../../stickers'
import { tableColoredIn } from '../tables'
import type { PageProps } from '../types'
import { CreatureArt } from './art'
import { OUT } from './geometry'
import { LINES, STAGE_LABELS, creatureName, type CreatureLine } from './lines'
import { creatureStage } from './stage'
import { Stamp } from './stamps'

const mastered = (p: Progress, table: number) => FACTORS.filter((b) => p.facts[factId(table, b)].level >= 4).length

/** What a creature needs to reach its next stage, and how far along it is (0–1). */
function nextStep(p: Progress, line: CreatureLine, stage: number): { text: string; done: number } {
  const t = line.table
  const friends = tableColoredIn(p, t)
  if (stage === 0) return { text: `Answer a ×${t} fact to hatch it!`, done: 0 }
  if (stage === 1) return { text: `${friends} of 6 facts befriended to evolve`, done: friends / 6 }
  if (stage === 2) return { text: `${friends} of 12 befriended to evolve`, done: friends / 12 }
  if (stage === 3) {
    const best = mastered(p, t)
    return { text: `${best} of 12 best friends to shine`, done: best / 12 }
  }
  return { text: 'Every fact mastered!', done: 1 }
}

const tint = (line: CreatureLine) => ({ '--c': line.colors.main, '--c-dark': line.colors.dark, '--c-light': line.colors.light }) as CSSProperties

/**
 * Each table's creature stage, and props for its list item: the tint, plus a one-time hop with a
 * sparkle for a creature that grew since `what` was last on screen (several go one after another).
 */
function useTeam(progress: Progress, what: string) {
  const stages = LINES.map((line) => creatureStage(progress, line.table))
  const grown = useNewSince(progress, what, Object.fromEntries(LINES.map((line, i) => [line.table, stages[i]])))
  const order = LINES.filter((line) => grown.has(String(line.table)))
  const itemProps = (line: CreatureLine) =>
    grown.has(String(line.table))
      ? { 'data-fresh': '', style: { ...tint(line), '--fresh-i': order.indexOf(line) } as CSSProperties }
      : { style: tint(line) }
  return { stages, itemProps }
}

/** The grid page's top: a card for each table's creature. */
export function Collection({ progress }: { progress: Progress }) {
  const { stages, itemProps } = useTeam(progress, 'cards')
  return (
    <section className="creature-cards" aria-label="Your creatures">
      <ol>
        {LINES.map((line, i) => {
          const stage = stages[i]
          const next = nextStep(progress, line, stage)
          return (
            <li key={line.table} className={`creature-card stage-${stage}`} {...itemProps(line)}>
              <span className="creature-num">×{line.table}</span>
              <CreatureArt table={line.table} stage={stage} size={92} tap />
              <span className="creature-name">{creatureName(line, stage)}</span>
              <span className="creature-stage">
                {STAGE_LABELS[stage]} · {line.kind}
              </span>
              <span className="creature-meter" aria-hidden="true">
                <span style={{ width: `${Math.round(Math.min(1, next.done) * 100)}%` }} />
              </span>
              <span className="creature-next">{next.text}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** The home screen's shelf: the whole team (eggs too), then the place stamps collected so far. */
export function HomeShelf({ progress }: { progress: Progress }) {
  const { stages, itemProps } = useTeam(progress, 'team')
  const stamps = STICKER_IDS.filter((id) => progress.stickers.includes(id))
  // A stamp that's new since home was last shown gets pressed onto the page.
  const freshStamps = useNewSince(progress, 'stamps', Object.fromEntries(stamps.map((id) => [id, 1])))
  return (
    <section className="creature-team" aria-label="Your creatures">
      <ul className="team-row">
        {LINES.map((line, i) => (
          <li key={line.table} {...itemProps(line)}>
            <CreatureArt table={line.table} stage={stages[i]} size={60} fit tap />
          </li>
        ))}
      </ul>
      {stamps.length > 0 && (
        <div className="sticker-shelf stamp-row" aria-label="Your place stamps" data-tap-each="">
          {stamps.map((id) => (
            <Stamp key={id} id={id} size={56} className={freshStamps.has(id) ? 'fresh' : ''} />
          ))}
        </div>
      )}
    </section>
  )
}

/** A page of the field journal. */
export function JournalPage({ entry, name, number, withSticker = false }: PageProps) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <article className={`card page journal ${withSticker ? 'with-sticker' : ''}`}>
      <header className="journal-head">
        <span className="journal-title">Field Journal</span>
        <span className="journal-day">Day {number}</span>
      </header>
      <p className="page-date">{date}</p>
      {entry.lines.map((line, i) => (
        <p key={i} className="entry-line">
          {line}
        </p>
      ))}
      <p className="signature">Explorer: {name}</p>
      {withSticker && <Stamp id={entry.sticker as StickerId} size={84} className="page-sticker" />}
    </article>
  )
}

/** Three eggs on the welcome cover. */
export function Cover() {
  return (
    <>
      <CreatureArt table={2} stage={0} size={62} fit className="cover-egg" />
      <CreatureArt table={4} stage={0} size={76} fit className="cover-egg" />
      <CreatureArt table={3} stage={0} size={62} fit className="cover-egg" />
    </>
  )
}

/** A paw print, marking facts that are best friends or legendary. */
export function Mark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <ellipse cx="10" cy="13" rx="4.6" ry="3.8" fill="currentColor" />
      <circle cx="4.4" cy="8" r="2.1" fill="currentColor" />
      <circle cx="8" cy="4.6" r="2.1" fill="currentColor" />
      <circle cx="12" cy="4.6" r="2.1" fill="currentColor" />
      <circle cx="15.6" cy="8" r="2.1" fill="currentColor" />
    </svg>
  )
}

/** A dashing paw, next to the speed dash's super-fast count. */
export function FastIcon() {
  return (
    <svg className="fast-paw" viewBox="0 0 40 30" width={40} height={30} aria-hidden="true">
      <path d="M3 9h9M1 15h10M3 21h9" stroke={OUT} strokeWidth={2.6} strokeLinecap="round" />
      <g transform="translate(14 1)">
        <ellipse cx="12" cy="18" rx="7" ry="6" fill="#ffd84d" stroke={OUT} strokeWidth={2.2} />
        <circle cx="3.5" cy="10.5" r="3.2" fill="#ffd84d" stroke={OUT} strokeWidth={2} />
        <circle cx="9" cy="5.5" r="3.2" fill="#ffd84d" stroke={OUT} strokeWidth={2} />
        <circle cx="15.5" cy="5.5" r="3.2" fill="#ffd84d" stroke={OUT} strokeWidth={2} />
        <circle cx="21" cy="10.5" r="3.2" fill="#ffd84d" stroke={OUT} strokeWidth={2} />
      </g>
    </svg>
  )
}

const PUFFS = [
  [100, 100, 62],
  [52, 92, 34],
  [148, 92, 34],
  [70, 54, 32],
  [130, 54, 32],
  [100, 42, 34],
  [62, 138, 32],
  [138, 138, 32],
  [100, 152, 32],
]

/** A puffy cloud behind the cheer. */
export function BurstShape() {
  return (
    <svg viewBox="0 0 200 200" className="burst-shape puff" aria-hidden="true">
      <g className="puff-edge">
        {PUFFS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g className="puff-fill">
        {PUFFS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  )
}
