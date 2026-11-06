import { type CSSProperties, Fragment } from 'react'
import { factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import { STICKER_IDS } from '../../stickers'
import { PrincessMark, PrincessReward } from './art'
import { sparkle, star } from './shapes'
import { CROWN_STAGES, crownStage, type CrownStage, gemOf, GEMS, gemsAt, P } from './palette'
import { levels } from './words'

type Gem = (typeof GEMS)[number]

/** A rough stone: a lumpy pebble around (cx, cy). */
const pebble = (cx: number, cy: number, r: number) => {
  const k = [1, 0.82, 1.05, 0.78, 0.96, 0.86, 1.02, 0.8]
  const pts = k.map((f, i) => {
    const a = (i / k.length) * Math.PI * 2 + 0.3
    return `${(cx + r * f * Math.cos(a)).toFixed(1)} ${(cy + r * f * Math.sin(a)).toFixed(1)}`
  })
  return `M${pts.join('L')}Z`
}

/**
 * One gem in its setting, drawn by the fact's level: an empty setting, a rough stone, a cut gem,
 * a polished one, a sparkling one, and a crown jewel with a gold ring and a glow.
 */
export function GemShape({ cx, cy, r, level, gem, oval = false }: { cx: number; cy: number; r: number; level: number; gem: Gem; oval?: boolean }) {
  const rx = oval ? r * 0.82 : r
  const ry = oval ? r * 1.12 : r
  if (level === 0) {
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fbf1d9" stroke="#9a7a3c" strokeWidth={1.3} strokeDasharray="2.2 1.6" />
  }
  if (level === 1) {
    return (
      <g>
        <path d={pebble(cx, cy, r * 0.95)} fill={P.stone} stroke={P.ink} strokeWidth={1.2} strokeLinejoin="round" />
        <circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.16} fill={P.stoneDark} />
        <circle cx={cx + r * 0.3} cy={cy + r * 0.25} r={r * 0.12} fill={P.stoneDark} />
      </g>
    )
  }
  const cut = level === 2
  return (
    <g>
      {level === 5 && <ellipse cx={cx} cy={cy} rx={rx * 1.75} ry={ry * 1.75} fill={gem.color} opacity={0.3} />}
      {level === 5 && <ellipse cx={cx} cy={cy} rx={rx + 1.8} ry={ry + 1.8} fill={P.gold} stroke={P.ink} strokeWidth={1} />}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={cut ? gem.light : gem.color} stroke={cut ? gem.dark : P.ink} strokeWidth={1.3} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.5} ry={ry * 0.5} fill="none" stroke={cut ? gem.color : gem.dark} strokeWidth={0.9} opacity={0.8} />
      <path
        d={`M${cx - rx} ${cy}H${cx - rx * 0.5}M${cx + rx * 0.5} ${cy}H${cx + rx}M${cx} ${cy - ry}V${cy - ry * 0.5}M${cx} ${cy + ry * 0.5}V${cy + ry}`}
        stroke={cut ? gem.color : gem.dark}
        strokeWidth={0.9}
        opacity={0.8}
      />
      {!cut && <path d={`M${cx - rx * 0.55} ${cy - ry * 0.15}Q${cx - rx * 0.45} ${cy - ry * 0.55} ${cx - rx * 0.1} ${cy - ry * 0.62}`} fill="none" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />}
      {level >= 4 && <path d={sparkle(cx + rx * 0.85, cy - ry * 0.85, r * (level === 5 ? 1.15 : 0.95))} fill="#fff" stroke={P.ink} strokeWidth={0.8} strokeLinejoin="round" />}
    </g>
  )
}

/** Where each fact's gem sits: 1 to 7 along the band, 8 to 12 on the points, left to right. */
const SPOTS: ReadonlyArray<{ x: number; y: number; oval: boolean }> = [
  ...[19, 32.7, 46.3, 60, 73.7, 87.3, 101].map((x) => ({ x, y: 77, oval: false })),
  { x: 19.5, y: 48, oval: true },
  { x: 41.5, y: 41, oval: true },
  { x: 60, y: 34, oval: true },
  { x: 78.5, y: 41, oval: true },
  { x: 100.5, y: 48, oval: true },
]

const BODY = 'M14 70 12 28 32 50 42 24 50 48 60 10 70 48 78 24 88 50 108 28 106 70Z'
const TIPS = [
  [12, 27],
  [42, 23],
  [78, 23],
  [108, 27],
] as const

/** A table's crown: its gems by level, gold once forged, on a velvet cushion once crowned. */
export function Crown({ progress, table, width = 120, label }: { progress: Progress; table: number; width?: number; label?: string }) {
  const gem = gemOf(table)
  const stage = crownStage(progress, table)
  const forged = stage >= 1
  return (
    <svg
      className={`princess-crown s${stage}`}
      viewBox="0 0 120 100"
      width={width}
      height={(width * 100) / 120}
      role="img"
      aria-label={label ?? `The ${table}s crown: ${CROWN_STAGES[stage].toLowerCase()}`}
    >
      {stage >= 4 && (
        <g fill={stage === 5 ? P.gold : '#fff'} stroke={P.ink} strokeWidth={1.2} strokeLinejoin="round">
          <path d={sparkle(6, 52, 6)} />
          <path d={sparkle(114, 52, 6)} />
          <path d={sparkle(26, 10, 5)} />
          <path d={sparkle(94, 10, 5)} />
        </g>
      )}
      {stage >= 3 && (
        <g>
          <path d="M4 92C4 84 14 82 60 82S116 84 116 92 106 99 60 99 4 99 4 92Z" fill={P.purple} stroke={P.ink} strokeWidth={2.5} />
          <path d="M14 88C30 85 90 85 106 88" fill="none" stroke="#9a78d8" strokeWidth={2} strokeLinecap="round" />
          <path d="M6 94 2 99M114 94 118 99" stroke={P.gold} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      <path
        d={BODY}
        fill={forged ? P.gold : '#f4eefc'}
        stroke={forged ? P.ink : '#9d8cbc'}
        strokeWidth={forged ? 3 : 2.2}
        strokeDasharray={forged ? undefined : '5 4'}
        strokeLinejoin="round"
      />
      {forged && <path d="M17 34 19 58M45 32 47 52" stroke={P.goldLight} strokeWidth={2.4} strokeLinecap="round" />}
      <rect
        x="11"
        y="66"
        width="98"
        height="21"
        rx="3"
        fill={forged ? P.goldDark : '#e9e0f7'}
        stroke={forged ? P.ink : '#9d8cbc'}
        strokeWidth={forged ? 3 : 2.2}
        strokeDasharray={forged ? undefined : '5 4'}
      />
      {TIPS.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={3.6} fill={forged ? P.goldLight : '#f4eefc'} stroke={forged ? P.ink : '#9d8cbc'} strokeWidth={1.8} />
      ))}
      {stage === 5 ? (
        <path d={star(60, 9, 7.5)} fill={P.goldLight} stroke={P.ink} strokeWidth={1.6} strokeLinejoin="round" />
      ) : (
        <circle cx={60} cy={9} r={4.2} fill={forged ? gem.color : '#f4eefc'} stroke={forged ? P.ink : '#9d8cbc'} strokeWidth={1.8} />
      )}
      {FACTORS.map((b, i) => {
        const spot = SPOTS[i]
        return <GemShape key={b} cx={spot.x} cy={spot.y} r={spot.oval ? 5 : 5.2} level={progress.facts[factId(table, b)].level} gem={gem} oval={spot.oval} />
      })}
    </svg>
  )
}

/** What the crown needs next, under it in the crown room. */
function nextStep(p: Progress, table: number, stage: CrownStage): string {
  if (stage === 0) return `${gemsAt(p, table, 1)} of 12 gems found`
  if (stage <= 2) return `${gemsAt(p, table, 3)} of 12 polished`
  if (stage === 3) return `${gemsAt(p, table, 4)} of 12 sparkling`
  if (stage === 4) return `${gemsAt(p, table, 5)} of 12 crown jewels`
  return 'Fit for a queen!'
}

/** The grid page's crowns: one for each times table, a gem for each fact. */
export function CrownRoom({ progress }: { progress: Progress }) {
  const crowned = FACTORS.filter((t) => crownStage(progress, t) >= 3).length
  return (
    <section className="card princess-crowns" aria-labelledby="princess-crowns-title">
      <h2 id="princess-crowns-title" className="princess-crowns-title">
        My crowns
      </h2>
      <p className="princess-crowns-note">
        Each times table has a crown. When all 12 of its gems are polished, it's crowning day! {crowned} of 12 crowns crowned.
      </p>
      <ol className="princess-crown-list">
        {FACTORS.map((t) => {
          const stage = crownStage(progress, t)
          return (
            <li key={t} className={`princess-crown-item s${stage}`}>
              <span className="pc-table">{t}s</span>
              <Crown progress={progress} table={t} width={112} />
              <span className="pc-gem" style={{ '--gem': gemOf(t).dark } as CSSProperties}>
                {gemOf(t).name}
              </span>
              <span className="pc-next">{nextStep(progress, t, stage)}</span>
              {stage > 0 && <span className="pc-badge">{CROWN_STAGES[stage]}</span>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** The 12 × 12 grid as gems: each table's row in its crown's gem color. */
export function GemGrid({ progress, selected, onSelect }: { progress: Progress; selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="dgrid princess-gems">
      <span className="dcell head">×</span>
      {FACTORS.map((b) => (
        <span key={`top-${b}`} className="dcell head">
          {b}
        </span>
      ))}
      {FACTORS.map((a) => {
        const gem = gemOf(a)
        const colors = { '--gem': gem.color, '--gem-light': gem.light, '--gem-dark': gem.dark } as CSSProperties
        return (
          <Fragment key={a}>
            <span className="dcell head row-head" style={colors}>
              {a}
            </span>
            {FACTORS.map((b) => {
              const id = factId(a, b)
              const level = progress.facts[id].level
              return (
                <button
                  key={id}
                  type="button"
                  className={`dcell gem l${level} ${selected === id ? 'selected' : ''}`}
                  style={colors}
                  aria-label={`${a} times ${b}: ${levels[level].name}`}
                  onClick={() => onSelect(id)}
                >
                  {level > 0 ? a * b : ''}
                  {level >= 4 && (
                    <span className="sparkle">
                      <PrincessMark size={12} />
                    </span>
                  )}
                </button>
              )
            })}
          </Fragment>
        )
      })}
    </div>
  )
}

/** The home screen's treasury: every royal treasure earned, on a velvet shelf. */
export function Treasury({ progress }: { progress: Progress }) {
  const collected = STICKER_IDS.filter((id) => progress.stickers.includes(id))
  const crowned = FACTORS.filter((t) => crownStage(progress, t) >= 3).length
  return (
    <section className="princess-treasury" aria-label="Your royal treasures">
      <p className="treasury-title">Royal treasury</p>
      {collected.length > 0 ? (
        <div className="treasury-shelf">
          {collected.map((id) => (
            <PrincessReward key={id} id={id} size={60} />
          ))}
        </div>
      ) : (
        <p className="treasury-empty">Finish a quest to bring home your first treasure!</p>
      )}
      <p className="treasury-note">{crowned} of 12 crowns crowned</p>
    </section>
  )
}
