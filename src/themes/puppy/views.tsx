import type { CSSProperties } from 'react'
import { dateFromDay } from '../../engine/dates'
import type { Progress } from '../../engine/types'
import { STICKER_IDS, type StickerId } from '../../stickers'
import type { PageProps } from '../types'
import { PuppyArt } from './pup-art'
import { INK, PUPS, STAGE_LABELS, nextStep, pupStage } from './pups'
import { PawPrint, PuppyReward } from './rewards'

const bed = (color: string) => ({ '--bed': color }) as CSSProperties

/** The grid page's top: a kennel for each table's puppy, and what it needs next. */
export function Collection({ progress }: { progress: Progress }) {
  const home = PUPS.filter((pup) => pupStage(progress, pup.table) > 0).length
  return (
    <section className="pup-yard" aria-labelledby="pup-yard-note">
      <p id="pup-yard-note" className="pup-yard-note">
        {home === 12 ? 'All 12 puppies are home!' : `${home} of 12 puppies have come home.`}
      </p>
      <ol className="pup-cards">
        {PUPS.map((pup) => {
          const stage = pupStage(progress, pup.table)
          const next = nextStep(progress, pup, stage)
          return (
            <li key={pup.table} className={`pup-card stage-${stage}`} style={bed(pup.bed)}>
              <svg className="pup-roof" viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 28.5L60 2.5L117 28.5Z" fill={pup.bed} stroke={INK} strokeWidth={3} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="pup-table">{pup.table}s</span>
              <span className="pup-pic">
                <PuppyArt table={pup.table} stage={stage} size={92} />
              </span>
              <span className="pup-name">{pup.name}</span>
              <span className="pup-stage">{STAGE_LABELS[stage]}</span>
              <span className="pup-meter" aria-hidden="true">
                <span style={{ width: `${Math.round(Math.min(1, next.done) * 100)}%` }} />
              </span>
              <span className="pup-next">{next.text}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** The home screen: every puppy (and empty beds still waiting), then the toys and treats so far. */
export function HomeShelf({ progress }: { progress: Progress }) {
  const toys = STICKER_IDS.filter((id) => progress.stickers.includes(id))
  const home = PUPS.filter((pup) => pupStage(progress, pup.table) > 0).length
  return (
    <section className="pup-home" aria-label="Your puppies, toys and treats">
      <ul className="pup-row">
        {PUPS.map((pup) => (
          <li key={pup.table}>
            <PuppyArt table={pup.table} stage={pupStage(progress, pup.table)} size={64} />
          </li>
        ))}
      </ul>
      {home === 0 && <p className="pup-home-note">Twelve puppy beds are ready. Start training to bring your first puppy home!</p>}
      {toys.length > 0 && (
        <div className="sticker-shelf pup-toys" aria-label="Your toys and treats">
          {toys.map((id) => (
            <PuppyReward key={id} id={id} size={58} />
          ))}
        </div>
      )}
    </section>
  )
}

/** An entry as a scrapbook page: a taped photo of a puppy, the day's notes, and love from the trainer. */
export function ScrapbookPage({ entry, name, number, withSticker = false }: PageProps) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  // A different puppy poses for each page, taking turns.
  const pup = PUPS[(number - 1) % PUPS.length]
  return (
    <article className={`card page scrapbook ${withSticker ? 'with-sticker' : ''}`}>
      <header className="scrap-head">
        <h2 className="dear">Puppy scrapbook</h2>
        <p className="scrap-no">
          <svg viewBox="0 0 20 20" width={20} height={20} aria-hidden="true">
            <PawPrint x={10} y={10} s={18} fill="currentColor" />
          </svg>
          Page {number}
        </p>
      </header>
      <p className="page-date">{date}</p>
      <figure className="scrap-photo">
        <PuppyArt table={pup.table} stage={2} size={104} />
        <figcaption>{pup.name} says hi!</figcaption>
      </figure>
      {entry.lines.map((line, i) => (
        <p key={i} className="entry-line">
          {line}
        </p>
      ))}
      <footer className="scrap-foot">
        <p className="signature">
          Love, <span className="sig-name">{name}</span>
        </p>
        {withSticker && <PuppyReward id={entry.sticker as StickerId} size={84} className="page-sticker" />}
      </footer>
    </article>
  )
}
