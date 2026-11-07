import type { CSSProperties } from 'react'
import { ALL_FACT_IDS, factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import { freshProps, useNewSince } from '../../motion'
import { STICKER_IDS } from '../../stickers'
import { tableStage } from '../tables'
import { cementMixer, dumpTruck, excavator } from './fleet'
import { Cone, Machine, Star } from './machines'
import { C, line } from './palette'
import { levels } from './words'

/** Floors from the top down: the 12s are the top floor, the 1s are at street level. */
const TOP_DOWN = [...FACTORS].reverse()

/** Window colors by level, for the small drawings of the tower. */
const MINI_FILL = ['#e3dfd6', '#d4e4f5', '#f6c89c', '#9fd3f5', '#ffe066', '#ffb700']

const floorsAt = (p: Progress, stage: number) => FACTORS.filter((n) => tableStage(p, n) >= stage).length

/** The crane on the roof, lowering a new window into place. */
function Crane() {
  return (
    <svg className="tower-crane" viewBox="0 0 400 84" preserveAspectRatio="xMidYMax meet" aria-hidden="true" data-tap="">
      <path d="M338 3 40 15M338 3 394 15" stroke={C.ink} strokeWidth={2} />
      <path d="M330 15 338 3 346 15" fill="none" {...line} />
      <rect x={30} y={14} width={366} height={10} fill={C.yellow} {...line} />
      <path
        d={`M34 24${Array.from({ length: 30 }, (_, i) => `L${40 + i * 12} ${i % 2 ? 24 : 14}`).join('')}`}
        fill="none"
        stroke={C.ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <rect x={330} y={24} width={16} height={60} fill={C.yellow} {...line} />
      <path d="M330 24 346 36 330 48 346 60 330 72 346 84" fill="none" stroke={C.ink} strokeWidth={1.8} />
      <rect x={358} y={24} width={34} height={14} rx={2} fill={C.concrete} {...line} />
      <rect x={310} y={24} width={20} height={15} rx={2} fill={C.yellow} {...line} />
      <rect x={314} y={27} width={12} height={7} fill={C.glass} stroke={C.ink} strokeWidth={1.5} />
      <rect x={112} y={24} width={16} height={5} fill={C.dark} stroke={C.ink} strokeWidth={1.5} />
      <g className="crane-hook">
        <path className="crane-cable" d="M120 29v26" stroke={C.ink} strokeWidth={1.8} />
        <g className="crane-load">
          <path d="M120 55v3q0 4-4 4" fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M120 58 106 66M120 58 134 66" stroke={C.ink} strokeWidth={1.6} />
          <rect x={104} y={66} width={32} height={16} rx={2} fill={C.glass} {...line} strokeWidth={2.5} />
          <path d="M109 78l8-8M118 79l9-9" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

/** Street level: dirt, a few machines and cones. */
function Ground() {
  const at = (x: number, scale: number) => `translate(${x} ${40 - 92 * scale}) scale(${scale})`
  return (
    <svg className="tower-ground" viewBox="0 0 400 56" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      <rect x={0} y={38} width={400} height={18} fill="#b98a55" />
      <path d="M0 38h400" stroke={C.ink} strokeWidth={3} />
      <path d="M30 47h6M90 50h4M150 46h5M220 50h6M290 47h4M350 50h6" stroke="#8a6234" strokeWidth={2.5} strokeLinecap="round" />
      <g transform={at(6, 0.4)}>{excavator}</g>
      <g transform={at(124, 0.22)}>
        <Cone size={100} />
      </g>
      <g transform={at(160, 0.38)}>{cementMixer}</g>
      <g transform={at(262, 0.22)}>
        <Cone size={100} />
      </g>
      <g transform={at(300, 0.4)}>{dumpTruck}</g>
    </svg>
  )
}

/**
 * The grid page's tower: a floor per table, a window per fact. Tapping a window shows the fact.
 * Windows that went up a level since the last look switch on one by one, from the ground up.
 */
export function Tower({
  progress,
  selected,
  onSelect,
  fresh,
}: {
  progress: Progress
  selected: string | null
  onSelect: (id: string) => void
  fresh: ReadonlySet<string>
}) {
  const freshOrder = ALL_FACT_IDS.filter((id) => fresh.has(id))
  return (
    <div className="tower">
      <Crane />
      <div className="tower-body">
        {TOP_DOWN.map((a) => (
          <div key={a} className={`floor stage-${tableStage(progress, a)}`} role="group" aria-label={`Floor ${a}: the ${a}s`}>
            <span className="floor-tag" aria-hidden="true">
              {a}
            </span>
            {FACTORS.map((b) => {
              const id = factId(a, b)
              const level = progress.facts[id].level
              return (
                <button
                  key={id}
                  type="button"
                  className={`dcell win l${level} ${selected === id ? 'selected' : ''}`}
                  aria-label={`${a} times ${b}: ${levels[level].name}`}
                  onClick={() => onSelect(id)}
                  {...freshProps(fresh.has(id), freshOrder.indexOf(id))}
                >
                  {level > 0 ? a * b : ''}
                  {level === 5 && (
                    <span className="win-star">
                      <Star size={11} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="tower-lots" aria-hidden="true">
        <span className="lot">×</span>
        {FACTORS.map((b) => (
          <span key={b} className="lot">
            {b}
          </span>
        ))}
      </div>
      <Ground />
    </div>
  )
}

/** A small drawing of the whole tower, with one floor picked out when `highlight` is given. */
export function MiniTower({ progress, highlight, className = '' }: { progress: Progress; highlight?: number; className?: string }) {
  const built = floorsAt(progress, 3)
  return (
    <svg className={`mini-tower ${className}`} viewBox="0 0 170 214" role="img" aria-label={`Your tower: ${built} of 12 floors built`}>
      <path d="M148 4 28 9M148 4 166 9" stroke={C.ink} strokeWidth={1.2} />
      <rect x={20} y={8} width={148} height={6} fill={C.yellow} stroke={C.ink} strokeWidth={2} />
      <rect x={142} y={14} width={8} height={24} fill={C.yellow} stroke={C.ink} strokeWidth={2} />
      <g className="crane-hook">
        <path className="crane-cable" d="M60 14v10" stroke={C.ink} strokeWidth={1.2} />
        <rect className="crane-load" x={53} y={24} width={14} height={8} rx={1} fill={C.glass} stroke={C.ink} strokeWidth={1.5} />
      </g>
      <rect x={14} y={38} width={142} height={156} fill={C.concrete} stroke={C.ink} strokeWidth={3} />
      {TOP_DOWN.map((a, row) => {
        const y = 42 + row * 12.6
        const lit = a === highlight
        return (
          <g key={a} className={lit ? 'mini-floor-picked' : undefined}>
            {FACTORS.map((b) => {
              const level = progress.facts[factId(a, b)].level
              return (
                <rect
                  key={b}
                  style={lit ? ({ '--i': b } as CSSProperties) : undefined}
                  x={19 + (b - 1) * 11.3}
                  y={y}
                  width={9}
                  height={9}
                  rx={1}
                  fill={MINI_FILL[level]}
                  stroke={level >= 3 ? C.ink : level > 0 ? '#8d939b' : 'none'}
                  strokeWidth={1}
                />
              )
            })}
          </g>
        )
      })}
      {highlight !== undefined && (
        <g className="mini-floor-frame">
          <rect x={10} y={42 + (12 - highlight) * 12.6 - 3} width={150} height={15} rx={3} fill="none" stroke={C.orange} strokeWidth={3.5} />
          <path d={`M0 ${42 + (12 - highlight) * 12.6 + 4.5}h7`} stroke={C.orange} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      )}
      <rect x={0} y={194} width={170} height={20} fill="#b98a55" />
      <path d="M0 194h170" stroke={C.ink} strokeWidth={3} />
    </svg>
  )
}

/** The grid page's sign: how much of the tower is up. */
export function SiteSign({ progress }: { progress: Progress }) {
  const windows = ALL_FACT_IDS.filter((id) => progress.facts[id].level >= 3).length
  return (
    <section className="site-sign" aria-label="Site progress">
      <div>
        <b>{windows}</b>
        <span>of 144 windows built</span>
      </div>
      <div>
        <b>{floorsAt(progress, 3)}</b>
        <span>of 12 floors built</span>
      </div>
      <div>
        <b>{floorsAt(progress, 4)}</b>
        <span>of 12 floors lit up</span>
      </div>
    </section>
  )
}

/** The home screen's yard: the tower so far, with every machine earned parked beside it. */
export function Yard({ progress }: { progress: Progress }) {
  const collected = STICKER_IDS.filter((id) => progress.stickers.includes(id))
  // A machine earned since home was last shown drives into the yard.
  const fresh = useNewSince(progress, 'yard', Object.fromEntries(collected.map((id) => [id, 1])))
  return (
    <section className="site-yard" aria-label="Your tower and machines">
      <figure className="yard-tower" data-tap="">
        <MiniTower progress={progress} />
        <figcaption>{floorsAt(progress, 3)} of 12 floors built</figcaption>
      </figure>
      <div className="yard-lot">
        <p className="yard-title">Machine yard</p>
        {collected.length > 0 ? (
          <div className="yard-machines" data-tap-each="">
            {collected.map((id) => (
              <Machine key={id} id={id} size={64} className={fresh.has(id) ? 'fresh' : ''} />
            ))}
          </div>
        ) : (
          <p className="yard-empty">Finish a shift to park your first machine here!</p>
        )}
      </div>
    </section>
  )
}
