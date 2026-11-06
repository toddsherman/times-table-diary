import { dateFromDay } from '../../engine/dates'
import type { StickerId } from '../../stickers'
import type { PageProps } from '../types'
import { LittleCrown, PrincessReward } from './art'
import { P } from './palette'
import { words } from './words'

/** A red wax seal pressed with her initial, two ribbons hanging under it. */
function WaxSeal({ initial }: { initial: string }) {
  // Uneven blobs around the edge, like wax that spread when it was pressed.
  const spread = [27, 25, 28, 26, 24, 28, 26, 27, 25, 28, 24, 27, 26, 28]
  const sizes = [7, 8.5, 6.5, 8, 7.5, 6, 8.5, 7, 8, 6.5, 8, 7, 7.5, 6.5]
  const bumps = spread.map((d, i) => {
    const a = (i / spread.length) * Math.PI * 2 + 0.2
    return [Math.round((40 + d * Math.cos(a)) * 10) / 10, Math.round((36 + d * Math.sin(a)) * 10) / 10, sizes[i]]
  })
  return (
    <svg className="wax-seal" viewBox="0 0 80 84" width={84} height={88} aria-hidden="true">
      <path d="M30 56 22 82 30 77 35 83 40 58Z" fill={P.purple} stroke={P.ink} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M50 56 58 82 50 77 45 83 40 58Z" fill={P.rose} stroke={P.ink} strokeWidth={2.2} strokeLinejoin="round" />
      {bumps.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#c8174f" />
      ))}
      <circle cx="40" cy="36" r="29" fill="#c8174f" />
      <circle cx="40" cy="36" r="21" fill="#de2d64" stroke="#9e0f3b" strokeWidth={2.5} />
      <text x="40" y="45" textAnchor="middle" fontFamily="'Cherry Swash', Georgia, serif" fontWeight={700} fontSize={initial.length > 1 ? 17 : 25} fill="#ffe0ea">
        {initial}
      </text>
      <path d="M22 22Q26 16 32 14" fill="none" stroke="#ff7aa3" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}

/** An entry as a royal letter: cream stationery, a crown letterhead, and a wax seal with her initial. */
export function RoyalLetter({ entry, name, number, withSticker = false }: PageProps) {
  const date = dateFromDay(entry.day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const initial = (name.trim()[0] ?? 'P').toUpperCase()
  return (
    <article className={`card page royal-letter ${withSticker ? 'with-sticker' : ''}`}>
      <header className="letter-head">
        <svg className="letter-crest" viewBox="0 0 40 26" width={54} height={35} aria-hidden="true">
          <path d="M2 22H38" stroke={P.goldDark} strokeWidth={2} strokeLinecap="round" />
          <LittleCrown x={8} y={4} w={24} />
        </svg>
        <p className="letter-from">From the castle of Princess {name}</p>
        <p className="letter-meta">
          <span className="page-date">{date}</span>
          <span className="letter-no">Letter No. {number}</span>
        </p>
      </header>
      <h2 className="dear">{words.greeting}</h2>
      {entry.lines.map((text, i) => (
        <p key={i} className="entry-line">
          {text}
        </p>
      ))}
      <footer className="letter-foot">
        {withSticker && <PrincessReward id={entry.sticker as StickerId} size={80} className="page-sticker" />}
        <div className="letter-sign">
          <p className="letter-close">Yours royally,</p>
          <p className="signature">{words.signature(name)}</p>
        </div>
        <WaxSeal initial={initial} />
      </footer>
    </article>
  )
}
