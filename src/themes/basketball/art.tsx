import type { ReactNode } from 'react'
import type { StickerId } from '../../stickers'
import { C, line, REWARD_NAMES, thin } from './palette'

const bold = { ...line, strokeWidth: 3.5 } as const
const DISPLAY = "'Graduate', 'Nunito', serif"

/** A basketball: orange, four seams, a shine. Used on its own and inside other drawings. */
export function Ball({ cx = 50, cy = 50, r = 40, stroke = 3.5 }: { cx?: number; cy?: number; r?: number; stroke?: number }) {
  const k = r / 40
  const at = (x: number, y: number) => `${round(cx + (x - 50) * k)} ${round(cy + (y - 50) * k)}`
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.ball} stroke={C.navy} strokeWidth={stroke} />
      <path
        d={`M${at(50, 10)}V${round(cy + 40 * k)}M${at(10, 50)}H${round(cx + 40 * k)}M${at(22, 21)}C${at(35, 36)} ${at(35, 64)} ${at(22, 79)}M${at(78, 21)}C${at(65, 36)} ${at(65, 64)} ${at(78, 79)}`}
        fill="none"
        stroke={C.navy}
        strokeWidth={stroke * 0.78}
        strokeLinecap="round"
      />
      <path d={`M${at(25, 36)}Q${at(29, 24)} ${at(40, 18)}`} fill="none" stroke="#ffd6ad" strokeWidth={stroke * 1.1} strokeLinecap="round" />
    </g>
  )
}

const round = (x: number) => Math.round(x * 10) / 10

const Shadow = ({ rx = 34 }: { rx?: number }) => <ellipse cx={50} cy={94} rx={rx} ry={3.2} fill="rgba(27, 42, 78, 0.18)" />

const ART: Record<StickerId, ReactNode> = {
  // The basketball: the picker tile's picture.
  star: (
    <>
      <Shadow rx={30} />
      <Ball cx={50} cy={48} r={40} />
    </>
  ),
  heart: (
    <>
      <Shadow rx={42} />
      <path d="M8 74h84v5q0 8-8 8H16q-8 0-8-8Z" fill="#fff" {...bold} />
      <path d="M8 80h84" stroke={C.ball} strokeWidth={3} />
      <path d="M12 74V27q0-6 6-6h21q4 0 5 4l4 14q17 4 32 12 12 7 12 23Z" fill={C.royal} {...bold} />
      <path d="M69 52q16 6 21 22H60q1-16 9-22Z" fill="#fff" {...line} />
      <path d="M44 31q11 9 24 21" stroke="#fff" strokeWidth={8} strokeLinecap="round" fill="none" />
      <path d="M46 28l-1 9M53 33l-1 9M60 39l-1 9" stroke={C.navy} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={27} cy={42} r={9} fill="#fff" {...line} />
      <path d="M27 36.5l1.7 3.6 3.9.4-2.9 2.7.8 3.9-3.5-2-3.5 2 .8-3.9-2.9-2.7 3.9-.4Z" fill={C.ball} />
      <path d="M12 60h30" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.55} />
    </>
  ),
  crown: (
    <>
      <path d="M28 25h-8q-7 0-7 9 0 12 17 15M72 25h8q7 0 7 9 0 12-17 15" fill="none" stroke={C.navy} strokeWidth={9} strokeLinecap="round" />
      <path d="M28 25h-8q-7 0-7 9 0 12 17 15M72 25h8q7 0 7 9 0 12-17 15" fill="none" stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <path d="M26 14h48v14q0 25-24 30-24-5-24-30Z" fill={C.gold} {...bold} />
      <path d="M33 20v8q0 14 9 21" fill="none" stroke="#fff3c4" strokeWidth={4} strokeLinecap="round" />
      <Ball cx={52} cy={33} r={10} stroke={2.2} />
      <rect x={44} y={57} width={12} height={12} fill={C.goldDark} {...line} />
      <rect x={32} y={68} width={36} height={8} rx={2} fill={C.gold} {...line} />
      <rect x={24} y={76} width={52} height={17} rx={3} fill={C.navy} {...line} />
      <rect x={36} y={80} width={28} height={8} rx={1.5} fill={C.gold} />
    </>
  ),
  bolt: (
    <>
      <path d="M84 52q10-24-6-40" fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" />
      <path d="M14 30q-6-7-4-15M24 24q-3-7 1-14" fill="none" stroke={C.navy} strokeWidth={3} strokeLinecap="round" />
      <rect x={10} y={36} width={42} height={18} rx={5} fill={C.steel} {...bold} />
      <circle cx={57} cy={60} r={27} fill={C.steel} {...bold} />
      <rect x={30} y={39} width={10} height={6} rx={1.5} fill={C.navy} />
      <circle cx={80} cy={54} r={6} fill="none" stroke={C.navy} strokeWidth={4} />
      <path d="M41 52q4-12 18-14" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
      <circle cx={57} cy={63} r={9} fill="#9aa4b4" stroke={C.navy} strokeWidth={2} />
    </>
  ),
  cupcake: (
    <>
      <Shadow rx={24} />
      <rect x={45} y={5} width={10} height={14} rx={3} fill="#fff" {...line} />
      <rect x={34} y={17} width={32} height={15} rx={4} fill={C.ball} {...bold} />
      <path d="M38 24h24" stroke={C.ballDark} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={28} y={30} width={44} height={62} rx={11} fill={C.royal} {...bold} />
      <path d="M28 46q22 6 44 0M28 76q22 6 44 0" fill="none" stroke={C.navy} strokeWidth={2.5} />
      <path d="M36 38v42" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.45} />
      <path d="M52 52q-9 11-9 16a9 9 0 0 0 18 0q0-5-9-16Z" fill="#fff" {...line} strokeWidth={2.5} />
    </>
  ),
  rainbow: (
    <>
      <rect x={12} y={6} width={76} height={46} rx={4} fill="#fff" {...bold} />
      <rect x={36} y={24} width={28} height={20} fill="none" stroke={C.orange} strokeWidth={3.5} />
      <path d="M17 11h12" stroke={C.steel} strokeWidth={3} strokeLinecap="round" />
      <path
        d="M31 55 39 89M40 57 45 91M50 58V92M60 57 55 91M69 55 61 89M33 64q17 7 34 0M36 74q14 6 28 0M39 84q11 5 22 0"
        fill="none"
        stroke={C.navy}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <rect x={46} y={46} width={8} height={7} fill={C.steel} {...thin} />
      <ellipse cx={50} cy={54} rx={21} ry={5} fill="none" stroke={C.navy} strokeWidth={8} />
      <ellipse cx={50} cy={54} rx={21} ry={5} fill="none" stroke={C.orange} strokeWidth={4} />
    </>
  ),
  notes: (
    <>
      <path d="M26 4v14M74 4v14" stroke={C.navy} strokeWidth={3} strokeLinecap="round" />
      <rect x={6} y={16} width={88} height={66} rx={7} fill={C.board} {...bold} />
      <rect x={13} y={33} width={30} height={26} rx={3} fill="#2a2f3c" />
      <rect x={57} y={33} width={30} height={26} rx={3} fill="#2a2f3c" />
      <text x={28} y={54} textAnchor="middle" fontFamily={DISPLAY} fontSize={19} fill={C.amber}>
        12
      </text>
      <text x={72} y={54} textAnchor="middle" fontFamily={DISPLAY} fontSize={19} fill={C.amber}>
        8
      </text>
      <text x={28} y={29} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight={800} fontSize={8} fill="#fff">
        HOME
      </text>
      <text x={72} y={29} textAnchor="middle" fontFamily="'Nunito', sans-serif" fontWeight={800} fontSize={8} fill="#fff">
        AWAY
      </text>
      <circle cx={50} cy={40} r={2.5} fill={C.red} />
      <circle cx={50} cy={50} r={2.5} fill={C.red} />
      <path d="M16 70h68" stroke="#3a4152" strokeWidth={6} strokeLinecap="round" strokeDasharray="0.1 9" />
      <path d="M16 70h68" stroke={C.amber} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="0.1 9" />
      <path d="M40 86v8M60 86v8" stroke={C.navy} strokeWidth={3} />
    </>
  ),
  icecream: (
    <>
      <path
        d="M40 46V16q0-9 9-9t9 9v28q11-2 13 6 9-1 10 8v13q0 18-18 20H44q-18-2-20-20V56q-5-2-5-9t7-8q7 0 10 8Z"
        fill={C.ball}
        {...bold}
      />
      <path d="M58 45v8M70 51v7" stroke={C.navy} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M45 14v20" stroke="#ffd6ad" strokeWidth={4} strokeLinecap="round" />
      <text x={52} y={78} textAnchor="middle" fontFamily={DISPLAY} fontSize={24} fill="#fff" stroke={C.navy} strokeWidth={2.4} paintOrder="stroke">
        #1
      </text>
      <rect x={34} y={84} width={34} height={11} rx={3} fill={C.navy} {...line} />
    </>
  ),
  flower: (
    <>
      <path d="M32 8h10q8 12 16 0h10q2 18 14 24v58q0 4-4 4H22q-4 0-4-4V32q12-6 14-24Z" fill={C.royal} {...bold} />
      <path d="M43 9q7 11 14 0" fill="none" stroke={C.ball} strokeWidth={4} strokeLinecap="round" />
      <path d="M31 10q-2 16-12 22M69 10q2 16 12 22" fill="none" stroke={C.ball} strokeWidth={4} strokeLinecap="round" />
      <text x={50} y={72} textAnchor="middle" fontFamily={DISPLAY} fontSize={32} fill="#fff" stroke={C.ball} strokeWidth={1.5} paintOrder="stroke">
        12
      </text>
      <path d="M22 84h56" stroke={C.ball} strokeWidth={3} />
    </>
  ),
  cool: (
    <>
      <path d="M26 4h16l14 44H40Z" fill={C.navy} {...line} />
      <path d="M74 4H58L44 48h16Z" fill={C.ball} {...line} />
      <path d="M62 6 50 44" stroke="#fff" strokeWidth={2.5} opacity={0.6} />
      <rect x={42} y={44} width={16} height={8} rx={2} fill={C.goldDark} {...line} />
      <circle cx={50} cy={70} r={24} fill={C.gold} {...bold} />
      <circle cx={50} cy={70} r={16} fill="none" stroke={C.goldDark} strokeWidth={2.5} />
      <path d="M50 54v32M34 70h32M39 59q6 11 0 22M61 59q-6 11 0 22" fill="none" stroke={C.goldDark} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M33 62q3-8 10-11" fill="none" stroke="#fff3c4" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  cat: (
    <>
      <path d="M20 48 13 8l28 24Z" fill={C.ball} {...bold} />
      <path d="M80 48 87 8 59 32Z" fill={C.ball} {...bold} />
      <path d="M21 36 18 18l12 10Z M79 36l3-18-12 10Z" fill={C.navy} />
      <path d="M50 92q-30-2-35-34-1-14 10-22 25-12 50 0 11 8 10 22-5 32-35 34Z" fill={C.ball} {...bold} />
      <path d="M50 92q-21-1-28-21 15-4 28 7 13-11 28-7-7 20-28 21Z" fill="#fff" {...line} strokeWidth={3} />
      <path d="M17 41q33-14 66 0l-1 9q-32-12-64 0Z" fill={C.navy} {...line} strokeWidth={2.5} />
      <path d="M18 45.5q32-12 64 0" fill="none" stroke={C.gold} strokeWidth={2.5} />
      <ellipse cx={37} cy={60} rx={4.5} ry={5.5} fill={C.navy} />
      <ellipse cx={63} cy={60} rx={4.5} ry={5.5} fill={C.navy} />
      <circle cx={38.5} cy={58} r={1.6} fill="#fff" />
      <circle cx={64.5} cy={58} r={1.6} fill="#fff" />
      <ellipse cx={50} cy={74} rx={5} ry={3.6} fill={C.navy} />
      <path d="M44 81q6 5 12 0" fill="none" stroke={C.navy} strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  balloon: (
    <>
      <rect x={14} y={10} width={72} height={86} rx={6} fill="#a8703f" {...bold} />
      <rect x={21} y={20} width={58} height={70} rx={2} fill="#fff" {...line} strokeWidth={2.5} />
      <rect x={36} y={4} width={28} height={13} rx={4} fill={C.steel} {...line} />
      <path d="M21 28h58M50 28v10a12 12 0 0 1-24 0" fill="none" stroke="#9aa4b4" strokeWidth={2} />
      <path d="M30 52l8 8M38 52l-8 8M58 70l8 8M66 70l-8 8" stroke={C.ball} strokeWidth={3.2} strokeLinecap="round" />
      <circle cx={60} cy={52} r={5} fill="none" stroke={C.royal} strokeWidth={3} />
      <circle cx={34} cy={77} r={5} fill="none" stroke={C.royal} strokeWidth={3} />
      <path d="M40 66q8 8 16 6" fill="none" stroke={C.navy} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="4 3" />
      <path d="M52 68l5 4-6 2" fill="none" stroke={C.navy} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M64 46q4-6 0-10" fill="none" stroke={C.navy} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M61 37l3-2 2 3" fill="none" stroke={C.navy} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
}

export function Gear({ id, size, className = '' }: { id: StickerId; size: number; className?: string }) {
  const art = ART[id]
  if (!art) return null
  return (
    <svg className={`sticker bb-gear ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={REWARD_NAMES[id]}>
      {art}
    </svg>
  )
}

/** A basketball on fire, for the fast break's super-fast count. */
export function FireBall({ size = 30 }: { size?: number }) {
  return (
    <svg className="sticker bb-fireball" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M62 20C42 16 26 6 4 16c12 6 14 12 8 17C2 38-1 46 1 56c10-5 18-2 21 2-10 8-12 18-8 28 14-10 30-6 48-4Z"
        fill={C.amber}
        stroke={C.navy}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d="M62 31c-16-3-28-8-40-4 8 6 8 12 2 17 8 0 12 4 12 8-6 4-8 10-6 16 10-6 20-4 32-2Z" fill={C.red} />
      <Ball cx={64} cy={52} r={31} stroke={4.5} />
    </svg>
  )
}

/** The little basketball on facts at swish and slam dunk, in the grid and the legend. */
export function MiniBall({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <circle cx={10} cy={10} r={8.6} fill={C.ball} stroke={C.navy} strokeWidth={1.6} />
      <path d="M10 1.5v17M1.5 10h17M4.6 4.2q3.4 5.8 0 11.6M15.4 4.2q-3.4 5.8 0 11.6" fill="none" stroke={C.navy} strokeWidth={1.2} />
    </svg>
  )
}

/** Bulbs around the scoreboard's edge, behind the cheer. */
const BULBS = (() => {
  const out: Array<[number, number]> = []
  for (let i = 0; i < 9; i++) {
    const x = 24 + i * 24
    out.push([x, 13], [x, 107])
  }
  for (const y of [37, 60, 83]) out.push([12, y], [228, y])
  return out
})()

/** The scoreboard flashing a cheer: a dark panel ringed with light bulbs. */
export function ScoreboardBurst() {
  return (
    <svg viewBox="0 0 240 120" className="burst-shape bb-burst" aria-hidden="true">
      <rect x={3} y={3} width={234} height={114} rx={16} style={{ fill: 'var(--bb-burst, #171a22)' }} stroke={C.navy} strokeWidth={6} />
      <rect x={22} y={24} width={196} height={72} rx={8} fill="none" style={{ stroke: 'var(--bb-burst-line, #3a4152)' }} strokeWidth={3} />
      {BULBS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.2} style={{ fill: 'var(--bb-bulb, #ffb627)' }} />
      ))}
    </svg>
  )
}

export function Cover() {
  return (
    <>
      <Gear id="rainbow" size={66} />
      <Gear id="star" size={74} />
      <Gear id="crown" size={60} />
    </>
  )
}
