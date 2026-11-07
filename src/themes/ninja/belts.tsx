import { FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import { freshProps, useNewSince } from '../../motion'
import { atLeast, BELTS, GOLD, INK, tableBelt } from './palette'

/**
 * A belt tied in a knot, tails hanging. With `label`, the table number sits on the knot. A tap swings
 * it; `fresh` drops it onto its peg (`order` staggers several).
 */
export function BeltArt({ level, label, width = 120, fresh = false, order = 0 }: { level: number; label?: string; width?: number; fresh?: boolean; order?: number }) {
  const belt = BELTS[level]
  const none = level === 0
  const fill = none ? 'none' : belt.color
  return (
    <svg
      className="ninja-belt"
      viewBox="0 0 120 84"
      width={width}
      height={(width * 84) / 120}
      role="img"
      aria-label={belt.name}
      data-tap=""
      {...freshProps(fresh, order)}
    >
      <g
        stroke={none ? '#9a93b5' : INK}
        strokeWidth={none ? 2.5 : 3.5}
        strokeLinejoin="round"
        strokeDasharray={none ? '6 5' : undefined}
        fill={fill}
      >
        <path d="M52 34 34 76 48 79 60 38Z" />
        <path d="M68 34 86 76 72 79 60 38Z" />
        <rect x="4" y="16" width="112" height="18" rx="4" />
        <rect x="45" y="9" width="30" height="31" rx="8" />
      </g>
      {level === 4 && <path d="M38.5 65.5 51 68.8 49.7 73.3 36.5 70.1ZM81.5 65.5 69 68.8 70.3 73.3 83.5 70.1Z" fill={GOLD} />}
      {level === 5 && <path d="M10 21h28M82 21h28M50 14h8" stroke="#fff4c9" strokeWidth={3} strokeLinecap="round" />}
      {label && (
        <text
          x="60"
          y="31"
          textAnchor="middle"
          fontFamily="'M PLUS Rounded 1c', sans-serif"
          fontWeight={800}
          fontSize={label.length > 1 ? 15 : 17}
          fill={level === 4 ? GOLD : none ? '#9a93b5' : INK}
        >
          {label}
        </text>
      )}
    </svg>
  )
}

/** The grid page's belt rack: one belt per times table, and what the next belt needs. */
export function BeltRack({ progress }: { progress: Progress }) {
  const belts = Object.fromEntries(FACTORS.map((t) => [t, tableBelt(progress, t)]))
  const earned = FACTORS.filter((t) => belts[t] > 0).length
  // A belt earned since the rack was last open drops onto its peg.
  const fresh = useNewSince(progress, 'belts', belts)
  const freshOrder = FACTORS.filter((t) => fresh.has(String(t)))
  return (
    <section className="card ninja-rack" aria-labelledby="ninja-rack-title">
      <h2 id="ninja-rack-title" className="ninja-rack-title">
        Belt rack
      </h2>
      <p className="ninja-rack-note">
        A table earns a belt when all 12 of its facts reach it. {earned} of 12 tables have a belt.
      </p>
      <ol className="ninja-pegs">
        {FACTORS.map((t) => {
          const b = belts[t]
          const next = b < 5 ? `${atLeast(progress, t, b + 1)} of 12 to ${BELTS[b + 1].name.toLowerCase()}` : 'Grand master!'
          return (
            <li key={t} className={`ninja-peg b${b}`}>
              <span className="ninja-peg-table">{t}s</span>
              <BeltArt level={b} width={96} fresh={fresh.has(String(t))} order={freshOrder.indexOf(t)} />
              <span className="ninja-peg-belt">{b > 0 ? BELTS[b].name : 'No belt yet'}</span>
              <span className="ninja-peg-next">{next}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
