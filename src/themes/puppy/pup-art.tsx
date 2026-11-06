import { useId, type ReactNode } from 'react'
import { BLUE, GOLD, INK, RED, STAGE_LABELS, pupFor, type Pup } from './pups'

const line = { stroke: INK, strokeWidth: 2.6, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const thin = { stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round', strokeLinecap: 'round', fill: 'none' } as const
const PINK = '#ff9aa6'
const TONGUE = '#ff8193'
const CUSHION = '#fff4e0'
/** Mirrors a drawing left to right across the middle of the 100 × 100 box. */
const MIRROR = 'matrix(-1 0 0 1 100 0)'

const HEAD = 'M50 18C64.5 18 73 27.5 73 39.5C73 51.5 63 58.5 50 58.5C37 58.5 27 51.5 27 39.5C27 27.5 35.5 18 50 18Z'
const MUZZLE = 'M50 39.5C57.5 39.5 62 44 62 48.5C62 53.5 56.5 56 50 56C43.5 56 38 53.5 38 48.5C38 44 42.5 39.5 50 39.5Z'
const NOSE = 'M45 43.2C46.5 41.6 53.5 41.6 55 43.2C55.6 45 52.6 47.4 50 47.6C47.4 47.4 44.4 45 45 43.2Z'
const BODY = 'M36.5 93C31.5 82 33.5 63 50 59.5C66.5 63 68.5 82 63.5 93Z'

/** Left ears; the right ones are the same drawings mirrored. */
const EAR = {
  floppy: 'M32.5 23.5C23 23 16.5 34 18 47C18.8 54.5 26 56.5 29.5 50.5C33 44.5 35.5 32 32.5 23.5Z',
  long: 'M32.5 23C22 22.5 14 38 15 56C15.5 64.5 24.5 66 27.5 58.5C31.5 49 35.5 32.5 32.5 23Z',
  pointy: 'M30 31C27.5 22 27.5 13 30.5 8.5C32.5 6 35 6.5 37.5 9C41 13 44.5 17 47 21.5Z',
  pointyInner: 'M32.2 25C31.2 19 31.6 14.2 33 11.8C36 14.6 39 18 41.4 21Z',
  folded: 'M31.5 22.5C36 17 41.5 15.6 46.5 18C45 24.5 40.5 29.5 36.5 32.5C33 31 31.5 27 31.5 22.5Z',
} as const

/** Points around the head for a fluffy coat, and around a plume for a fluffy tail. */
const FLUFF = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2
  return [Math.round((50 + 21.5 * Math.cos(a)) * 10) / 10, Math.round((39.5 + 19.5 * Math.sin(a)) * 10) / 10] as const
})

type Mood = 'shy' | 'happy'

/** Circles drawn as one fluffy shape: every outline first, then every fill, so only the outer edge shows. */
function Puff({ circles, fill }: { circles: ReadonlyArray<readonly [number, number, number]>; fill: string }) {
  return (
    <>
      {circles.map(([x, y, r]) => (
        <circle key={`o${x}-${y}`} cx={x} cy={y} r={r} fill={INK} stroke={INK} strokeWidth={5.2} />
      ))}
      {circles.map(([x, y, r]) => (
        <circle key={`f${x}-${y}`} cx={x} cy={y} r={r} fill={fill} />
      ))}
    </>
  )
}

/** A dog bone, centered on (x, y). */
export function Bone({ x, y, length, r, fill = '#fff8ea', width = 2.4 }: { x: number; y: number; length: number; r: number; fill?: string; width?: number }) {
  const ends = [
    [x - length / 2, y - r * 0.78],
    [x - length / 2, y + r * 0.78],
    [x + length / 2, y - r * 0.78],
    [x + length / 2, y + r * 0.78],
  ] as const
  const bar = { x: x - length / 2, y: y - r * 0.72, width: length, height: r * 1.44 }
  return (
    <g>
      {ends.map(([cx, cy]) => (
        <circle key={`o${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={INK} stroke={INK} strokeWidth={width * 2} />
      ))}
      <rect {...bar} fill={INK} stroke={INK} strokeWidth={width * 2} />
      {ends.map(([cx, cy]) => (
        <circle key={`f${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
      <rect {...bar} fill={fill} />
    </g>
  )
}

/** A four-pointed twinkle. */
export const Twinkle = ({ x, y, s, fill = GOLD }: { x: number; y: number; s: number; fill?: string }) => (
  <path
    d={`M${x} ${y - s}Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y}Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s}Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y}Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z`}
    fill={fill}
    stroke={INK}
    strokeWidth={1.2}
    strokeLinejoin="round"
  />
)

/** Relative luminance of a #rrggbb color, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function Eyes({ pup, mood }: { pup: Pup; mood: Mood }) {
  const big = mood === 'shy'
  const rx = big ? 3.9 : 3.5
  const ry = big ? 4.5 : 4
  // Dark eyes vanish into dark fur, so they get a light rim there.
  const dark = luminance(pup.coat) < 0.12
  const rims = [dark, dark || pup.marks.includes('patch')]
  return (
    <>
      {[40.5, 59.5].map((cx, i) => (
        <g key={cx}>
          {rims[i] && <ellipse cx={cx} cy={37} rx={rx + 1.3} ry={ry + 1.3} fill="#fff8ee" />}
          {pup.eye ? (
            <>
              <ellipse cx={cx} cy={37} rx={rx} ry={ry} fill={pup.eye} stroke={INK} strokeWidth={1.4} />
              <ellipse cx={cx} cy={37.4} rx={rx * 0.55} ry={ry * 0.6} fill={INK} />
            </>
          ) : (
            <ellipse cx={cx} cy={37} rx={rx} ry={ry} fill={INK} />
          )}
          <circle cx={cx + 1.3} cy={35.3} r={big ? 1.7 : 1.35} fill="#fff" />
          <circle cx={cx - 0.9} cy={38.7} r={big ? 0.9 : 0.6} fill="#fff" />
        </g>
      ))}
      {big && <path d="M36.2 31.2Q39 29.4 42.2 29.4M63.8 31.2Q61 29.4 57.8 29.4" {...thin} strokeWidth={1.7} />}
    </>
  )
}

/** The head, centered on (50, 38.5), with its ears and markings. */
export function PupHead({ pup, mood }: { pup: Pup; mood: Mood }) {
  const id = `pup${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const ear = pup.ear ?? pup.shade
  const marks = new Set(pup.marks)
  const fluffy = marks.has('fluffy')
  const back = (kind: 'pointy' | 'round') =>
    kind === 'pointy' ? (
      <>
        <path d={EAR.pointy} fill={ear === pup.shade ? pup.coat : ear} {...line} />
        <path d={EAR.pointyInner} fill="#ffb9ae" />
      </>
    ) : (
      <>
        <circle cx={31.5} cy={22.5} r={9.5} fill={ear} {...line} />
        <circle cx={32} cy={23} r={5} fill={pup.table === 10 ? '#ffc8cd' : pup.coat} />
      </>
    )
  const behindLeft = pup.ears === 'pointy' || pup.ears === 'mixed' ? back('pointy') : pup.ears === 'round' ? back('round') : null
  const behindRight = pup.ears === 'pointy' ? back('pointy') : pup.ears === 'round' ? back('round') : null
  const frontLeft = pup.ears === 'floppy' || pup.ears === 'long' || pup.ears === 'folded' ? <path d={EAR[pup.ears]} fill={ear} {...line} /> : null
  const frontRight =
    pup.ears === 'mixed' ? <path d={EAR.floppy} fill={ear} {...line} /> : frontLeft
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={HEAD} />
        </clipPath>
      </defs>
      {fluffy && <Puff circles={FLUFF.map(([x, y]) => [x, y, 6.5] as const)} fill={pup.coat} />}
      {behindLeft}
      {behindRight && <g transform={MIRROR}>{behindRight}</g>}
      {marks.has('tuft') && (
        <Puff
          circles={[
            [43.5, 19.5, 5],
            [50, 16.5, 5.5],
            [56.5, 19.5, 5],
          ]}
          fill={pup.coat}
        />
      )}
      <path d={HEAD} fill={pup.coat} {...(fluffy ? {} : line)} />
      <g clipPath={`url(#${id})`}>
        {marks.has('mask') && (
          <>
            <path d="M25 43C33 37.5 40 40.5 44.5 33L50 27L55.5 33C60 40.5 67 37.5 75 43V62H25Z" fill={pup.light} />
            <ellipse cx={40.5} cy={30.2} rx={2.8} ry={1.9} fill={pup.light} />
            <ellipse cx={59.5} cy={30.2} rx={2.8} ry={1.9} fill={pup.light} />
          </>
        )}
        {marks.has('cheeks') && (
          <>
            <ellipse cx={35.5} cy={47.5} rx={8.5} ry={7} fill={pup.light} />
            <ellipse cx={64.5} cy={47.5} rx={8.5} ry={7} fill={pup.light} />
          </>
        )}
        {marks.has('blaze') && <path d="M46.8 16H53.2L55.4 41H44.6Z" fill={pup.light} />}
        {marks.has('patch') && <ellipse cx={60.5} cy={35.5} rx={8.5} ry={8} transform="rotate(-18 60.5 35.5)" fill={pup.shade} />}
        {marks.has('spots') && <ellipse cx={37.5} cy={25.5} rx={4.2} ry={3.3} fill={pup.shade} />}
        {marks.has('brows') && (
          <>
            <ellipse cx={40} cy={30.4} rx={3} ry={2.1} fill={pup.light} />
            <ellipse cx={60} cy={30.4} rx={3} ry={2.1} fill={pup.light} />
          </>
        )}
        <path d={MUZZLE} fill={pup.light} />
      </g>
      {marks.has('beard') && (
        <path d="M39.5 47.5C37 54 39.5 61.5 44 60.6C45.6 63.8 54.4 63.8 56 60.6C60.5 61.5 63 54 60.5 47.5C57 51 43 51 39.5 47.5Z" fill={pup.light} {...line} strokeWidth={2} />
      )}
      <ellipse cx={34.5} cy={46.5} rx={3.6} ry={2.2} fill={PINK} opacity={mood === 'shy' ? 0.75 : 0.5} />
      <ellipse cx={65.5} cy={46.5} rx={3.6} ry={2.2} fill={PINK} opacity={mood === 'shy' ? 0.75 : 0.5} />
      <Eyes pup={pup} mood={mood} />
      <path d={NOSE} fill={INK} />
      <ellipse cx={48} cy={43.3} rx={1.7} ry={0.9} fill="#fff" opacity={0.75} />
      {mood === 'happy' ? (
        <>
          <path d="M47.6 50.6C47.3 54.8 48.3 56.6 50 56.6C51.7 56.6 52.7 54.8 52.4 50.6C51.5 51.4 48.5 51.4 47.6 50.6Z" fill={TONGUE} {...line} strokeWidth={1.6} />
          <path d="M50 51.8V54.6" stroke="#d9576a" strokeWidth={1.2} strokeLinecap="round" />
          <path d="M50 47.6V49.6M45 49.2C46.5 51.8 49 51.8 50 49.6C51 51.8 53.5 51.8 55 49.2" {...thin} strokeWidth={2} />
        </>
      ) : (
        <path d="M50 47.6V49M46.6 49C47.6 50.6 49.2 50.6 50 49C50.8 50.6 52.4 50.6 53.4 49" {...thin} />
      )}
      {frontLeft}
      {frontRight && <g transform={MIRROR}>{frontRight}</g>}
    </g>
  )
}

function Tail({ pup, wag }: { pup: Pup; wag: boolean }) {
  if (pup.tail === 'curl') {
    const d = 'M63 82C72 82 80 77 79.5 68.5C79 61.5 70.5 61 70 66.5'
    return (
      <>
        <path d={d} fill="none" stroke={INK} strokeWidth={9.4} strokeLinecap="round" />
        <path d={d} fill="none" stroke={pup.coat} strokeWidth={4.4} strokeLinecap="round" />
      </>
    )
  }
  if (pup.tail === 'fluff') {
    return (
      <Puff
        circles={[
          [73, 83, 6.5],
          [79, 75, 7],
          [77, 66, 6],
        ]}
        fill={pup.coat}
      />
    )
  }
  return (
    <>
      <path d="M62 86C72 86.5 79.5 80 81 70C81.6 66.6 86.2 66.4 86.4 70.2C86.4 81.5 76.5 91.5 63 92Z" fill={pup.coat} {...line} />
      {wag && <path d="M85.5 61.5Q89 61 90.5 57.5M90 67Q93 67.5 95.5 65" {...thin} />}
    </>
  )
}

function Rosette() {
  const petals = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2
    const r = i % 2 === 0 ? 9 : 7
    return `${Math.round((30 + r * Math.cos(a)) * 10) / 10},${Math.round((65 + r * Math.sin(a)) * 10) / 10}`
  }).join(' ')
  return (
    <g>
      <path d="M27.4 66L23 81.5L26 80.2L27.6 83.4L31.6 67Z" fill={BLUE} {...line} strokeWidth={1.6} />
      <path d="M32.6 66L37 81.5L34 80.2L32.4 83.4L28.4 67Z" fill={BLUE} {...line} strokeWidth={1.6} />
      <polygon points={petals} fill={BLUE} {...line} strokeWidth={1.8} />
      <circle cx={30} cy={65} r={4.2} fill={GOLD} stroke={INK} strokeWidth={1.6} />
      <Twinkle x={30} y={65} s={2.6} fill="#fff7d6" />
    </g>
  )
}

/** The dog bed: its back and cushion, then (after anything lying in it) its front bolster. */
const BedBack = ({ color }: { color: string }) => (
  <>
    <ellipse cx={50} cy={79} rx={44} ry={16} fill={color} {...line} />
    <ellipse cx={50} cy={80.5} rx={33.5} ry={9.5} fill={CUSHION} stroke={INK} strokeWidth={2} />
  </>
)

const BedFront = ({ color }: { color: string }) => (
  <>
    <path d="M6 79C6 89.5 26 95.5 50 95.5C74 95.5 94 89.5 94 79C88 84.5 71 87.5 50 87.5C29 87.5 12 84.5 6 79Z" fill={color} {...line} />
    <path d="M15 87C25 90.4 37 91.8 50 91.8C63 91.8 75 90.4 85 87" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={1.6} strokeDasharray="3 3" />
  </>
)

const Paw = ({ x, y, fill }: { x: number; y: number; fill: string }) => (
  <>
    <ellipse cx={x} cy={y} rx={5.8} ry={3.7} fill={fill} {...line} strokeWidth={2.2} />
    <path d={`M${x - 1.6} ${y - 0.8}v2M${x + 1.6} ${y - 0.8}v2`} {...thin} strokeWidth={1.3} />
  </>
)

/** Drawing for one stage of a puppy; `art` below wraps it in an svg. */
function pupDrawing(pup: Pup, stage: number): ReactNode {
  const marks = new Set(pup.marks)
  if (stage <= 0) {
    return (
      <>
        <path
          d="M50 62C40 55 35 49 35 43.5C35 39 38.5 36 42.5 36C46 36 48.5 38 50 40.5C51.5 38 54 36 57.5 36C61.5 36 65 39 65 43.5C65 49 60 55 50 62Z"
          fill="none"
          stroke={INK}
          strokeOpacity={0.45}
          strokeWidth={2.4}
          strokeDasharray="4 3.5"
          strokeLinejoin="round"
        />
        <BedBack color={pup.bed} />
        <Bone x={50} y={80} length={15} r={3.2} />
        <BedFront color={pup.bed} />
      </>
    )
  }
  if (stage === 1) {
    const paw = marks.has('socks') ? pup.light : pup.coat
    return (
      <>
        <BedBack color={pup.bed} />
        <ellipse cx={50} cy={80.5} rx={20} ry={7.5} fill={pup.coat} stroke={INK} strokeWidth={2} />
        <g transform="translate(50 64.5) scale(0.8) translate(-50 -38.5)">
          <PupHead pup={pup} mood="shy" />
        </g>
        <BedFront color={pup.bed} />
        <Paw x={41} y={87.6} fill={paw} />
        <Paw x={59} y={87.6} fill={paw} />
      </>
    )
  }
  const paw = marks.has('socks') ? pup.light : pup.coat
  return (
    <>
      <ellipse cx={50} cy={95.2} rx={31} ry={3.4} fill={INK} opacity={0.14} />
      <Tail pup={pup} wag />
      <ellipse cx={34.5} cy={86} rx={10.5} ry={8.5} fill={pup.coat} {...line} />
      <ellipse cx={65.5} cy={86} rx={10.5} ry={8.5} fill={pup.coat} {...line} />
      <BodyFill pup={pup} />
      <rect x={41} y={75} width={7} height={17} rx={3.5} fill={pup.coat} {...line} strokeWidth={2.2} />
      <rect x={52} y={75} width={7} height={17} rx={3.5} fill={pup.coat} {...line} strokeWidth={2.2} />
      <Paw x={44.5} y={92.2} fill={paw} />
      <Paw x={55.5} y={92.2} fill={paw} />
      <PupHead pup={pup} mood="happy" />
      {stage >= 3 && (
        <>
          <path d="M37.6 56.6Q50 64.5 62.4 56.6L63 60.8Q50 69.5 37 60.8Z" fill={RED} {...line} strokeWidth={2} />
          <circle cx={50} cy={65.8} r={1.7} fill="none" stroke={INK} strokeWidth={1.4} />
          <circle cx={50} cy={70.6} r={5.2} fill={GOLD} stroke={INK} strokeWidth={2} />
          <text x={50} y={72.6} textAnchor="middle" fontFamily="'Nunito', system-ui, sans-serif" fontWeight={800} fontSize={pup.table > 9 ? 5 : 6} fill={INK}>
            {pup.table}
          </text>
        </>
      )}
      {stage >= 4 && (
        <>
          <Rosette />
          <Twinkle x={15} y={22} s={5} />
          <Twinkle x={86} y={14} s={4} />
          <Twinkle x={90} y={44} s={3.4} />
        </>
      )}
    </>
  )
}

function BodyFill({ pup }: { pup: Pup }) {
  const id = `body${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const marks = new Set(pup.marks)
  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <path d={BODY} fill={pup.coat} />
      <g clipPath={`url(#${id})`}>
        {marks.has('saddle') && <path d="M28 58H72V82C65 75 58 72.5 50 72.5C42 72.5 35 75 28 82Z" fill={pup.shade} />}
        {marks.has('spots') && (
          <>
            <circle cx={39.5} cy={72} r={3.3} fill={pup.shade} />
            <circle cx={61.5} cy={79} r={2.9} fill={pup.shade} />
            <circle cx={58} cy={67.5} r={2.2} fill={pup.shade} />
          </>
        )}
        <ellipse cx={50} cy={80} rx={8.5} ry={14} fill={pup.light} />
      </g>
      <path d={BODY} fill="none" {...line} />
    </>
  )
}

/**
 * A table's puppy at a stage: its bed (0), shy in its bed (1), sitting (2), with a collar (3), champion (4).
 * Every stage shares one square, so puppies line up; `fit` trims the empty sky above a bed instead.
 */
export function PuppyArt({ table, stage, size = 92, fit = false, className = '' }: { table: number; stage: number; size?: number; fit?: boolean; className?: string }) {
  const pup = pupFor(table)
  const label = stage === 0 ? `${pup.name}'s bed, waiting` : `${pup.name}: ${STAGE_LABELS[stage].toLowerCase()}`
  const trim = fit && stage <= 1
  return (
    <svg
      className={`pup-art stage-${stage} ${className}`}
      viewBox={trim ? '0 34 100 64' : '0 0 100 100'}
      width={size}
      height={trim ? size * 0.64 : size}
      role="img"
      aria-label={label}
    >
      {pupDrawing(pup, stage)}
    </svg>
  )
}
