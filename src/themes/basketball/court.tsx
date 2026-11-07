import type { CSSProperties } from 'react'
import { ALL_FACT_IDS, factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import { freshProps, useNewSince } from '../../motion'
import { STICKER_IDS } from '../../stickers'
import { Gear } from './art'
import { C, MILESTONE_NAMES, nextStep, SPOT, tableLevel } from './palette'
import { levels } from './words'

const DISPLAY = "'Graduate', 'Nunito', serif"
const round = (x: number) => Math.round(x * 10) / 10

/** Where each fact's spot sits on a half court: 1–7 around the three-point line, 8–12 inside it. */
const SPOTS = FACTORS.map((b) => {
  const outer = b <= 7
  const deg = outer ? 180 + (b - 1) * 30 : 198 + (b - 8) * 36
  const r = outer ? 46 : 27
  const a = (deg * Math.PI) / 180
  // How far the spot is from the middle of the court, so a tap can ripple out from the hoop.
  const ripple = outer ? 4 + Math.abs(b - 4) : Math.abs(b - 10)
  return { b, x: round(60 + r * Math.cos(a)), y: round(12 - r * Math.sin(a)), ripple }
})

/** A half court from above: lane, free-throw circle, three-point line, hoop at the top. */
function Court() {
  return (
    <g>
      <rect x={1.5} y={1.5} width={117} height={67} rx={4} fill={C.mapleLight} stroke={C.navy} strokeWidth={2.5} />
      <path d="M14 3v64M28 3v64M42 3v64M56 3v64M70 3v64M84 3v64M98 3v64M112 3v64" stroke="#d9b47c" strokeWidth={1} />
      <rect x={48} y={3} width={24} height={27} fill="rgba(232, 89, 12, 0.2)" stroke="#fff" strokeWidth={1.6} />
      <circle cx={60} cy={30} r={9} fill="none" stroke="#fff" strokeWidth={1.6} />
      <path d="M23 3v9a37 37 0 0 0 74 0V3" fill="none" stroke="#fff" strokeWidth={1.6} />
      <path d="M52 5.5h16" stroke={C.navy} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={60} cy={9.5} r={3.2} fill="none" stroke={C.orange} strokeWidth={1.8} />
    </g>
  )
}

/**
 * One table's shot chart: a spot for each fact, drawn by its level. Spots in `fresh` (facts that
 * went up since the charts were last open) pop in, in the order of `freshOrder`. A tap ripples the
 * made shots out from the hoop.
 */
export function ShotChart({
  progress,
  table,
  className = '',
  fresh,
  freshOrder = [],
}: {
  progress: Progress
  table: number
  className?: string
  fresh?: ReadonlySet<string>
  freshOrder?: readonly string[]
}) {
  const made = FACTORS.filter((b) => progress.facts[factId(table, b)].level >= 3).length
  return (
    <svg className={`bb-shot-chart ${className}`} viewBox="0 0 120 70" role="img" aria-label={`${table}s shot chart: ${made} of 12 at layup or better`} data-tap="">
      <Court />
      {SPOTS.map(({ b, x, y, ripple }) => {
        const id = factId(table, b)
        const level = progress.facts[id].level
        const s = SPOT[level]
        const isFresh = fresh?.has(id) ?? false
        return (
          <g
            key={b}
            className={level >= 3 ? 'bb-spot made' : 'bb-spot'}
            data-fresh={isFresh ? '' : undefined}
            style={{ '--ripple': ripple, ...(isFresh && { '--fresh-i': freshOrder.indexOf(id) }) } as CSSProperties}
          >
            <circle cx={x} cy={y} r={6.4} fill={s.fill} stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} />
            <text x={x} y={y + 2.6} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight={800} fontSize={7.4} fill={s.text}>
              {b}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const tablesAt = (p: Progress, level: number) => FACTORS.filter((t) => tableLevel(p, t) >= level).length

/**
 * A pennant (or, from banner up, a championship banner) hanging from the rafters, with the table on
 * it. A fresh one (raised since the rafters were last shown) drops in, `order`-th of them.
 */
export function Pennant({ level, table, width = 120, fresh = false, order = 0 }: { level: number; table: number; width?: number; fresh?: boolean; order?: number }) {
  const label = String(table)
  const big = label.length > 1 ? 34 : 40
  const banner = level >= 4
  const fill = ['none', '#fff', C.ball, C.navy, C.navy, C.gold][level]
  const ink = [C.navySoft, C.navy, '#fff', '#fff', C.gold, C.navy][level]
  const shape = banner ? 'M14 16H86V108L68 96 50 108 32 96 14 108Z' : 'M12 16H88L50 112Z'
  return (
    <svg
      className={level > 0 ? 'bb-pennant up' : 'bb-pennant'}
      viewBox="0 0 100 120"
      width={width}
      height={(width * 120) / 100}
      role="img"
      aria-label={`${table}s: ${MILESTONE_NAMES[level]}`}
      data-tap=""
      {...freshProps(fresh, order)}
    >
      <path d="M50 2v10" stroke={C.navySoft} strokeWidth={2.5} />
      <path
        d={shape}
        fill={fill}
        stroke={level === 0 ? '#9a8a74' : C.navy}
        strokeWidth={level === 0 ? 3 : 4}
        strokeDasharray={level === 0 ? '7 6' : undefined}
        strokeLinejoin="round"
      />
      {(level === 1 || level === 3) && <path d="M17 26H83" stroke={C.ball} strokeWidth={6} />}
      {level === 2 && <path d="M17 26H83" stroke="#fff" strokeWidth={6} />}
      {banner && <path d="M21 23H79V96L68 88 50 98 32 88 21 96Z" fill="none" stroke={level === 5 ? C.navy : C.gold} strokeWidth={2.5} strokeLinejoin="round" />}
      {level === 4 && (
        <text x={50} y={40} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight={800} fontSize={11} letterSpacing={1} fill={ink}>
          CHAMPS
        </text>
      )}
      {level === 5 && (
        <text textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight={800} fontSize={10} letterSpacing={0.5} fill={ink}>
          <tspan x={50} y={36}>
            HALL OF
          </tspan>
          <tspan x={50} y={47}>
            FAME
          </tspan>
        </text>
      )}
      <text x={50} y={banner ? 80 : 62} textAnchor="middle" fontFamily={DISPLAY} fontSize={banner ? big + 2 : big} fill={ink}>
        {label}
      </text>
    </svg>
  )
}

/** The grid page's top: a scoreboard of the season, then a shot chart for each times table. */
export function ShotCharts({ progress }: { progress: Progress }) {
  const made = ALL_FACT_IDS.filter((id) => progress.facts[id].level >= 3).length
  const fresh = useNewSince(progress, 'charts', Object.fromEntries(ALL_FACT_IDS.map((id) => [id, progress.facts[id].level])))
  const freshOrder = FACTORS.flatMap((t) => FACTORS.map((b) => factId(t, b))).filter((id) => fresh.has(id))
  return (
    <section className="bb-charts" aria-label="Shot charts">
      <div className="bb-board">
        <div>
          <b>{made}</b>
          <span>of 144 shots made</span>
        </div>
        <div>
          <b>{tablesAt(progress, 3)}</b>
          <span>of 12 games won</span>
        </div>
        <div>
          <b>{tablesAt(progress, 4)}</b>
          <span>of 12 banners</span>
        </div>
      </div>
      <p className="bb-key">
        Each court is a times table. Spots 1 to 7 are around the three-point line, 8 to 12 are inside it. A{' '}
        {levels[3].name.toLowerCase()} or better counts as made.
      </p>
      <ol className="bb-chart-list">
        {FACTORS.map((t) => {
          const level = tableLevel(progress, t)
          const next = nextStep(progress, t, level)
          return (
            <li key={t} className={`bb-chart m${level}`}>
              <span className="bb-chart-head">
                <b>{t}s</b>
                <span>{MILESTONE_NAMES[level]}</span>
              </span>
              <ShotChart progress={progress} table={t} fresh={fresh} freshOrder={freshOrder} />
              <span className="bb-chart-meter" aria-hidden="true">
                <span style={{ width: `${Math.round(next.done * 100)}%` }} />
              </span>
              <span className="bb-chart-next">{next.text}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** The home screen: a pennant for every table up in the rafters, and the trophy case below. */
export function Arena({ progress }: { progress: Progress }) {
  const collected = STICKER_IDS.filter((id) => progress.stickers.includes(id))
  // Pennants raised and prizes won since home was last shown drop in once.
  const raised = useNewSince(progress, 'rafters', Object.fromEntries(FACTORS.map((t) => [t, tableLevel(progress, t)])))
  const raisedOrder = FACTORS.filter((t) => raised.has(String(t)))
  const won = useNewSince(progress, 'trophies', Object.fromEntries(collected.map((id) => [id, 1])))
  return (
    <section className="bb-arena" aria-label="Your banners and trophy case">
      <div className="bb-rafters">
        <p className="bb-arena-title">The rafters</p>
        <ol className="bb-pennants">
          {FACTORS.map((t) => (
            <li key={t}>
              <Pennant level={tableLevel(progress, t)} table={t} width={46} fresh={raised.has(String(t))} order={raisedOrder.indexOf(t)} />
            </li>
          ))}
        </ol>
      </div>
      <div className="bb-case">
        <p className="bb-arena-title">Trophy case</p>
        {collected.length > 0 ? (
          <div className="bb-case-shelf" data-tap-each="">
            {collected.map((id) => (
              <Gear key={id} id={id} size={62} className={won.has(id) ? 'fresh' : ''} />
            ))}
          </div>
        ) : (
          <p className="bb-case-empty">Finish a game to put your first prize in the case!</p>
        )}
      </div>
    </section>
  )
}
