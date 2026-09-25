import type { ReactNode } from 'react'
import { STICKER_NAMES, type StickerId } from '../stickers'

const INK = '#2a2140'
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

const PETALS = [0, 60, 120, 180, 240, 300].map((deg) => {
  const r = (deg * Math.PI) / 180
  return [Math.round((50 + 22 * Math.cos(r)) * 10) / 10, Math.round((50 + 22 * Math.sin(r)) * 10) / 10]
})

const cloud = 'M10 86C2 86 2 74 11 74 11 66 23 64 26 71 30 66 40 69 38 77 44 78 44 86 38 86Z'

const ART: Record<StickerId, ReactNode> = {
  heart: (
    <>
      <path d="M50 86C22 66 8 48 18 30 27 14 44 18 50 32 56 18 73 14 82 30 92 48 78 66 50 86Z" fill="#ff4fa3" {...line} />
      <path d="M27 36c2-7 8-10 14-7" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  star: (
    <>
      <polygon points="50,12 60,38.2 88,39.6 66.2,57.3 73.5,84.4 50,69 26.5,84.4 33.8,57.3 12,39.6 40,38.2" fill="#ffd23f" {...line} />
      <circle cx="44" cy="50" r="3" fill={INK} />
      <circle cx="56" cy="50" r="3" fill={INK} />
      <path d="M44 57q6 5 12 0" fill="none" {...line} strokeWidth={3} />
    </>
  ),
  crown: (
    <>
      <path d="M16 74 12 30l20 18 18-28 18 28 20-18-4 44Z" fill="#ffd23f" {...line} />
      <rect x="16" y="68" width="68" height="14" rx="3" fill="#ffb020" {...line} />
      <circle cx="33" cy="75" r="4" fill="#ff4fa3" />
      <circle cx="50" cy="75" r="4" fill="#19c2b0" />
      <circle cx="67" cy="75" r="4" fill="#8b5cf6" />
      <circle cx="12" cy="30" r="5" fill="#ff4fa3" {...line} strokeWidth={3} />
      <circle cx="50" cy="20" r="5" fill="#ff4fa3" {...line} strokeWidth={3} />
      <circle cx="88" cy="30" r="5" fill="#ff4fa3" {...line} strokeWidth={3} />
    </>
  ),
  bolt: <polygon points="60,6 20,56 46,56 36,94 80,40 54,40 66,6" fill="#ffd23f" {...line} />,
  cupcake: (
    <>
      <path d="M26 56h48l-8 34H34Z" fill="#8b5cf6" {...line} />
      <path d="M40 60l2 28M50 60v28M60 60l-2 28" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M20 58c-6-12 4-24 16-22 2-12 14-18 22-12 8-4 20 2 20 14 10 2 14 14 8 20Z" fill="#ffb3d9" {...line} />
      <path d="M34 46l4-3M48 40l4 2M62 46l3-4M42 52l4 1M58 52l4-2" stroke="#19c2b0" strokeWidth={3} strokeLinecap="round" />
      <circle cx="52" cy="22" r="7" fill="#ff3b5c" {...line} strokeWidth={3} />
      <path d="M52 15q2-7 9-9" fill="none" {...line} strokeWidth={3} />
    </>
  ),
  rainbow: (
    <>
      {(
        [
          ['#ff4fa3', 36],
          ['#ffd23f', 27],
          ['#19c2b0', 18],
        ] as const
      ).map(([color, r]) => (
        <g key={r}>
          <path d={`M${50 - r} 72a${r} ${r} 0 0 1 ${2 * r} 0`} fill="none" stroke={INK} strokeWidth={12} />
          <path d={`M${50 - r} 72a${r} ${r} 0 0 1 ${2 * r} 0`} fill="none" stroke={color} strokeWidth={7} />
        </g>
      ))}
      <path d={cloud} fill="#fff" {...line} />
      <path d={cloud} transform="translate(52 0)" fill="#fff" {...line} />
    </>
  ),
  notes: (
    <>
      <path d="M41 70V28M83 60V18" fill="none" {...line} strokeWidth={5} />
      <path d="M41 28 83 18v12L41 40Z" fill="#8b5cf6" {...line} />
      <ellipse cx="31" cy="71" rx="12" ry="9" transform="rotate(-20 31 71)" fill="#8b5cf6" {...line} />
      <ellipse cx="73" cy="61" rx="12" ry="9" transform="rotate(-20 73 61)" fill="#8b5cf6" {...line} />
    </>
  ),
  icecream: (
    <>
      <path d="M32 52h36L50 94Z" fill="#f4b860" {...line} />
      <path d="M40 58l14 14M52 56l8 8M38 66l8 8" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M26 54c-6-18 8-36 24-36s30 18 24 36q-6 6-12 0t-12 0-12 0-12 0Z" fill="#ffb3d9" {...line} />
      <circle cx="50" cy="14" r="6" fill="#ff3b5c" {...line} strokeWidth={3} />
    </>
  ),
  flower: (
    <>
      {PETALS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={15} fill="#ff9fd0" {...line} />
      ))}
      <circle cx="50" cy="50" r="14" fill="#ffd23f" {...line} />
      <circle cx="45" cy="48" r="2.5" fill={INK} />
      <circle cx="55" cy="48" r="2.5" fill={INK} />
      <path d="M45 54q5 4 10 0" fill="none" {...line} strokeWidth={2.5} />
    </>
  ),
  cool: (
    <>
      <circle cx="50" cy="50" r="40" fill="#ffd23f" {...line} />
      <path d="M18 40h64" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M22 40h24v8c0 8-5 12-12 12s-12-4-12-12Z" fill={INK} />
      <path d="M54 40h24v8c0 8-5 12-12 12s-12-4-12-12Z" fill={INK} />
      <path d="M27 45l7-2M59 45l7-2" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <path d="M36 68q14 10 28 0" fill="none" {...line} />
    </>
  ),
  cat: (
    <>
      <path d="M18 44 20 12l22 18q8-3 16 0l22-18 2 32q4 38-32 40-36-2-32-40Z" fill="#c4b5fd" {...line} />
      <ellipse cx="38" cy="52" rx="4" ry="6" fill={INK} />
      <ellipse cx="62" cy="52" rx="4" ry="6" fill={INK} />
      <path d="M46 62h8l-4 5Z" fill="#ff4fa3" {...line} strokeWidth={2} />
      <path d="M50 67q-4 6-9 3M50 67q4 6 9 3" fill="none" {...line} strokeWidth={2.5} />
      <path d="M31 63H15M31 69l-14 4M69 63h16M69 69l14 4" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  balloon: (
    <>
      <path d="M50 76q-8 6 0 12t0 8" fill="none" {...line} strokeWidth={2.5} />
      <path d="M50 72c-16 0-26-16-26-32 0-16 12-28 26-28s26 12 26 28c0 16-10 32-26 32Z" fill="#19c2b0" {...line} />
      <path d="M45 78h10l-5-6Z" fill="#19c2b0" {...line} strokeWidth={3} />
      <path d="M36 30q2-8 10-10" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    </>
  ),
}

export function Sticker({ id, size = 72, className = '' }: { id: string; size?: number; className?: string }) {
  const art = ART[id as StickerId]
  if (!art) return null
  return (
    <svg className={`sticker ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={STICKER_NAMES[id as StickerId]}>
      {art}
    </svg>
  )
}
