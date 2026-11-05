import { useId, type ReactNode } from 'react'
import type { StickerId } from '../../stickers'
import { CreatureBody } from './art'
import { OUT, sparklePath } from './geometry'
import { LINES } from './lines'
import { STAMP_NAMES } from './words'

const line = { stroke: OUT, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** The picture area inside the stamp's white border. */
const X0 = 20
const Y0 = 14
const X1 = 80
const Y1 = 86

const cloud = (x: number, y: number, s = 1) => (
  <path
    d={`M${x} ${y}h${16 * s}a${4 * s} ${4 * s} 0 0 0 -3 -7a${5 * s} ${5 * s} 0 0 0 -9 -2a${4 * s} ${4 * s} 0 0 0 -6 4a${3.5 * s} ${3.5 * s} 0 0 0 2 5Z`}
    fill="#fff"
    {...line}
    strokeWidth={1.5}
  />
)

const SCENES: Record<StickerId, ReactNode> = {
  heart: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#aee4ff" />
      <circle cx={68} cy={28} r={7} fill="#ffd84d" {...line} />
      <path d="M20 52q8 -4 15 0t15 0t15 0t15 0V86H20Z" fill="#2f9be8" {...line} />
      <path d="M26 86v-12m0 5l-5 -5m5 1l5 -6M64 86v-14m0 6l6 -6m-6 2l-5 -7" stroke="#ff6f91" strokeWidth={4} strokeLinecap="round" />
      <path d="M40 66c4 -5 12 -5 15 0c-3 5 -11 5 -15 0Zm15 0l6 -4v8Z" fill="#ffb02e" {...line} strokeWidth={1.6} />
      <circle cx={45} cy={65} r={1} fill={OUT} />
    </>
  ),
  star: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#ffe7a6" />
      <path d={sparklePath(30, 26, 5)} fill="#fff" />
      <path d={sparklePath(70, 34, 3.5)} fill="#fff" />
      <rect x={X0} y={74} width={60} height={12} fill="#8fd35f" />
      <g transform="translate(50 56) scale(0.95) translate(-50 -67)">
        <CreatureBody line={LINES[1]} stage={1} />
      </g>
      <path d="M25 66l5 5l5 -6l6 6l5 -6l5 6l6 -6l5 6l5 -6l4 5v5c0 10 -11 15 -25 15s-25 -5 -25 -15Z" fill="#fff6e0" {...line} />
      <path d="M21 80c8 6 50 6 58 0c-2 7 -12 9 -29 9s-27 -2 -29 -9Z" fill="#b07a46" {...line} />
    </>
  ),
  crown: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#3b2f6b" />
      <path d="M20 14h60v14q-8 6 -14 0t-16 0t-16 0t-14 2Z" fill="#251d47" />
      <g {...line}>
        <polygon points="30,86 28,62 34,52 39,62 38,86" fill="#7ee8ff" />
        <polygon points="40,86 40,54 47,40 54,54 54,86" fill="#c39bff" />
        <polygon points="56,86 57,64 63,56 68,64 66,86" fill="#7ee8ff" />
        <polygon points="66,86 68,72 73,66 77,72 76,86" fill="#ff9fd2" />
      </g>
      <path d="M47 42v40M34 54v30M63 58v26" stroke="#fff" strokeWidth={1.6} opacity={0.7} />
      <path d={sparklePath(28, 36, 3)} fill="#fff" />
      <path d={sparklePath(70, 44, 2.5)} fill="#fff" />
    </>
  ),
  bolt: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#7e8fb8" />
      <path d="M22 30h12a5 5 0 0 0 -3 -8a6 6 0 0 0 -10 -1a4 4 0 0 0 1 9Z" fill="#c9d2ea" {...line} strokeWidth={1.5} />
      <path d="M50 28h22a6 6 0 0 0 -4 -10a7 7 0 0 0 -13 -1a5 5 0 0 0 -5 11Z" fill="#c9d2ea" {...line} strokeWidth={1.5} />
      <polygon points="60,30 48,52 56,52 46,74 66,46 57,46 65,30" fill="#ffe14d" {...line} />
      <path d="M20 86V64l10 -6l6 8l8 -4l4 24Z" fill="#6b5a4c" {...line} />
      <path d="M58 86l6 -18l8 4l8 -6V86Z" fill="#5b4b3f" {...line} />
    </>
  ),
  cupcake: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#d6f2ff" />
      <rect x={X0} y={72} width={60} height={14} fill="#7cc957" />
      <circle cx={36} cy={60} r={16} fill="#3f9a3a" {...line} />
      <circle cx={60} cy={56} r={18} fill="#4fb043" {...line} />
      {[
        [30, 54, '#e5375a'],
        [38, 62, '#7d3fc4'],
        [44, 52, '#e5375a'],
        [56, 48, '#7d3fc4'],
        [64, 58, '#e5375a'],
        [70, 48, '#e5375a'],
        [58, 64, '#7d3fc4'],
      ].map(([x, y, fill]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3.2} fill={fill as string} stroke={OUT} strokeWidth={1.2} />
      ))}
    </>
  ),
  rainbow: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#bfeaff" />
      {[
        ['#ff6f91', 26],
        ['#ffcf3d', 21],
        ['#7ccf5a', 16],
        ['#5aa9ff', 11],
      ].map(([c, r]) => (
        <path key={c} d={`M${50 - (r as number)} 50a${r} ${r} 0 0 1 ${2 * (r as number)} 0`} fill="none" stroke={c as string} strokeWidth={5} />
      ))}
      <path d="M20 40h14v46H20Z" fill="#6f9a52" {...line} />
      <path d="M66 40h14v46H66Z" fill="#6f9a52" {...line} />
      <path d="M34 40h32v46H34Z" fill="#5cc3ff" {...line} />
      <path d="M40 44v38M50 42v40M60 44v38" stroke="#fff" strokeWidth={2} opacity={0.8} />
      <path d="M30 86q20 -10 40 0" fill="#d6f3ff" {...line} />
    </>
  ),
  notes: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#ffe0a3" />
      <circle cx={62} cy={30} r={8} fill="#ff9a3c" {...line} />
      <path d="M20 66q16 -16 34 -4t26 -2V86H20Z" fill="#f2b45c" {...line} />
      <path d="M20 76q22 -10 44 0t16 -2V86H20Z" fill="#e39a3e" {...line} />
      <path d="M32 70V52m0 6h-4v-6m4 8h4v-6" fill="none" stroke="#3f9a3a" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 40q4 -3 8 0t8 0" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  icecream: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#cfeeff" />
      <polygon points="18,86 46,34 76,86" fill="#7f95b8" {...line} />
      <polygon points="46,34 36,52 42,49 47,55 52,49 57,53" fill="#fff" {...line} strokeWidth={1.6} />
      <polygon points="50,86 66,56 84,86" fill="#94a8c8" {...line} />
      {[
        [28, 28],
        [68, 24],
        [74, 44],
      ].map(([x, y]) => (
        <path key={x} d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`} stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
      ))}
    </>
  ),
  flower: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#c7ecff" />
      {cloud(26, 30)}
      <path d="M20 58q30 -10 60 0V86H20Z" fill="#8fd35f" {...line} />
      {[
        [30, 70, '#ff6f91'],
        [44, 64, '#ffd84d'],
        [58, 72, '#c39bff'],
        [70, 64, '#ff6f91'],
        [38, 80, '#ffd84d'],
        [64, 82, '#ff9fd2'],
      ].map(([x, y, fill]) => (
        <g key={`${x}-${y}`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              key={a}
              cx={(x as number) + Math.round(Math.cos((a * Math.PI) / 180) * 30) / 10}
              cy={(y as number) + Math.round(Math.sin((a * Math.PI) / 180) * 30) / 10}
              r={2.4}
              fill={fill as string}
            />
          ))}
          <circle cx={x as number} cy={y as number} r={1.6} fill="#fff" />
        </g>
      ))}
    </>
  ),
  cool: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#ffc9a8" />
      <path d="M44 34c-6 -4 -4 -12 2 -12c2 -6 10 -6 12 0c6 0 8 8 2 12Z" fill="#9c8d96" {...line} strokeWidth={1.6} />
      <polygon points="16,86 40,42 60,42 84,86" fill="#7a4a3a" {...line} />
      <path d="M40 42h20l-3 6l-4 -2l-3 8l-3 -6l-4 4Z" fill="#ff5a3d" {...line} strokeWidth={1.6} />
      <path d="M47 50l-4 14l5 -4l1 12" fill="none" stroke="#ff8d3c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  cat: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#cfe9c0" />
      <path d="M20 40l8 -18l8 18ZM62 38l9 -20l9 20Z" fill="#4c9e3d" {...line} />
      <rect x={X0} y={74} width={60} height={12} fill="#7cc957" />
      <path d="M32 82V64h8v18Z" fill="#fff3dc" {...line} />
      <path d="M22 66c0 -12 26 -12 26 0Z" fill="#e5375a" {...line} />
      <circle cx={30} cy={60} r={2.4} fill="#fff" />
      <circle cx={40} cy={58} r={2} fill="#fff" />
      <path d="M60 82V70h6v12Z" fill="#fff3dc" {...line} />
      <path d="M53 72c0 -9 20 -9 20 0Z" fill="#ff9a3c" {...line} />
      <circle cx={63} cy={67} r={1.8} fill="#fff" />
    </>
  ),
  balloon: (
    <>
      <rect x={X0} y={Y0} width={60} height={72} fill="#9fdcff" />
      {cloud(22, 30, 1.1)}
      {cloud(58, 78, 1.2)}
      <path d="M30 52h40l-6 10l-8 6l-8 -2l-8 -6Z" fill="#9a6b45" {...line} />
      <path d="M30 52h40v-4h-40Z" fill="#7cc957" {...line} />
      <path d="M52 48V36" stroke={OUT} strokeWidth={3} strokeLinecap="round" />
      <circle cx={52} cy={32} r={8} fill="#4fb043" {...line} />
      <path d="M38 48v-4l3 -2l2 6" fill="#e5375a" {...line} strokeWidth={1.4} />
    </>
  ),
}

/** A rectangle with a perforated (scalloped) edge, like a postage stamp. */
function perforated(x: number, y: number, w: number, h: number, r: number): string {
  const edge = (len: number) => Math.max(3, Math.round(len / (r * 3.2)))
  const parts: string[] = [`M${x} ${y}`]
  const side = (dx: number, dy: number, len: number) => {
    const n = edge(len)
    const step = len / n
    for (let i = 0; i < n; i++) {
      const pad = (step - 2 * r) / 2
      parts.push(`l${dx * pad} ${dy * pad}`)
      parts.push(`a${r} ${r} 0 0 0 ${dx * 2 * r} ${dy * 2 * r}`)
      parts.push(`l${dx * pad} ${dy * pad}`)
    }
  }
  side(1, 0, w)
  side(0, 1, h)
  side(-1, 0, w)
  side(0, -1, h)
  return `${parts.join('')}Z`
}

const PAPER = perforated(12, 6, 76, 88, 2.6)

/** A place stamp from an expedition. */
export function Stamp({ id, size = 72, className = '' }: { id: StickerId; size?: number; className?: string }) {
  const clip = `stamp${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg className={`sticker stamp-art ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={STAMP_NAMES[id]}>
      <path d={PAPER} fill="#fffdf6" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
      <defs>
        <clipPath id={clip}>
          <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>{SCENES[id]}</g>
      <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} fill="none" stroke={OUT} strokeWidth={2.2} />
    </svg>
  )
}
