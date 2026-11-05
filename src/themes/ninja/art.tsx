import type { ReactNode } from 'react'
import type { StickerId } from '../../stickers'

import { CRIMSON, GOLD, INK, REWARD_NAMES } from './palette'
const WASHI = '#fffaf0'
const WOOD = '#8a5a32'
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

const round = (x: number) => Math.round(x * 10) / 10
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [round(cx + r * Math.cos(a)), round(cy - r * Math.sin(a))] as const
}

/** The folding fan's paper: eight panels between an inner and outer arc, alternating colors. */
const FAN = Array.from({ length: 8 }, (_, i) => {
  const from = 160 - i * 17.5
  const to = from - 17.5
  const [ax, ay] = polar(50, 82, 46, from)
  const [bx, by] = polar(50, 82, 46, to)
  const [cx, cy] = polar(50, 82, 15, to)
  const [dx, dy] = polar(50, 82, 15, from)
  return { d: `M${ax} ${ay}A46 46 0 0 1 ${bx} ${by}L${cx} ${cy}A15 15 0 0 0 ${dx} ${dy}Z`, fill: i % 2 === 0 ? CRIMSON : '#f7efe0' }
})

const PETAL = 'M50 50C34 44 32 24 43 18L50 25 57 18C68 24 66 44 50 50Z'

const KOI_BODY = 'M88 50C86 38 70 30 54 33 40 36 28 43 20 50 28 57 40 64 54 67 70 70 86 62 88 50Z'

const ART: Record<StickerId, ReactNode> = {
  // Ninja mask: the picker tile's picture.
  star: (
    <>
      <path d="M86 26 98 16 96 30Z M87 34 98 44 93 30Z" fill={CRIMSON} {...line} strokeWidth={3} />
      <circle cx="50" cy="52" r="38" fill="#2b2f63" {...line} />
      <path d="M16 37C30 26 70 26 84 37L84 28C70 17 30 17 16 28Z" fill={CRIMSON} {...line} strokeWidth={3.5} />
      <circle cx="50" cy="27" r="4" fill={GOLD} stroke={INK} strokeWidth={2} />
      <circle cx="86" cy="31" r="5" fill={CRIMSON} {...line} strokeWidth={3} />
      <rect x="21" y="41" width="58" height="24" rx="12" fill="#f3d2b3" {...line} />
      <path d="M31 45.5l11 2.5M69 45.5l-11 2.5" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx="39" cy="54" rx="5" ry="6.5" fill={INK} />
      <ellipse cx="61" cy="54" rx="5" ry="6.5" fill={INK} />
      <circle cx="41" cy="51.5" r="1.9" fill="#fff" />
      <circle cx="63" cy="51.5" r="1.9" fill="#fff" />
    </>
  ),
  heart: (
    <>
      <defs>
        <clipPath id="ninja-koi-clip">
          <path d={KOI_BODY} />
        </clipPath>
      </defs>
      <path d="M14 86q8-6 16 0t16 0M54 90q8-6 16 0t16 0" fill="none" stroke="#7fb2e5" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M24 50 6 36C11 45 11 55 6 64Z" fill="#ff7a1a" {...line} />
      <path d="M50 35 42 22 60 32Z" fill="#ff7a1a" {...line} strokeWidth={3} />
      <path d="M52 65 45 79 61 69Z" fill="#ff7a1a" {...line} strokeWidth={3} />
      <path d={KOI_BODY} fill={WASHI} />
      <g clipPath="url(#ninja-koi-clip)">
        <path d="M46 30C58 26 72 32 76 40 66 48 54 46 44 38Z" fill="#ff7a1a" />
        <path d="M28 47C36 42 46 45 48 52 44 59 34 60 26 55Z" fill="#ff7a1a" />
        <ellipse cx="72" cy="45" rx="6" ry="4.5" fill="#d7262e" />
      </g>
      <path d={KOI_BODY} fill="none" {...line} />
      <circle cx="79" cy="47" r="3.2" fill={INK} />
      <circle cx="80" cy="46" r="1" fill="#fff" />
      <path d="M88 52q5 3 3 9" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  crown: (
    <>
      <path d="M50 3v10" stroke={CRIMSON} strokeWidth={5} strokeLinecap="round" />
      <circle cx="50" cy="18" r="6" fill="none" {...line} />
      <path d="M28 72C28 46 34 26 50 24 66 26 72 46 72 72Z" fill={GOLD} {...line} />
      <path d="M33 45h34M31 57h38" stroke="#b5832a" strokeWidth={3} strokeLinecap="round" />
      <circle cx="42" cy="36" r="2.3" fill="#b5832a" />
      <circle cx="50" cy="35" r="2.3" fill="#b5832a" />
      <circle cx="58" cy="36" r="2.3" fill="#b5832a" />
      <path d="M37 33c-2 8-3 16-3 24" fill="none" stroke="#fff4c9" strokeWidth={4} strokeLinecap="round" />
      <rect x="22" y="68" width="56" height="9" rx="4.5" fill="#d79a2b" {...line} />
      <circle cx="50" cy="85" r="6" fill={CRIMSON} {...line} strokeWidth={3} />
      <path d="M16 40 9 35M14 52H6M84 40l7-5M86 52h8" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  bolt: (
    <>
      <path d="M50 72c-10 8 12 12 2 24" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M43 76l8 4-8 4ZM58 86l-8 4 8 4Z" fill={GOLD} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points="50,8 84,40 50,74 16,40" fill={CRIMSON} {...line} />
      <path d="M50 12v58M20 40h60" stroke="#8a1020" strokeWidth={2.5} />
      <path d="M38 34 31 23l11 7ZM62 34l7-11-11 7Z" fill={GOLD} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M34 46C34 32 66 32 66 46 66 56 58 61 50 61 42 61 34 56 34 46Z" fill={GOLD} {...line} strokeWidth={3} />
      <circle cx="43" cy="43" r="5" fill="#fff" stroke={INK} strokeWidth={2.5} />
      <circle cx="57" cy="43" r="5" fill="#fff" stroke={INK} strokeWidth={2.5} />
      <circle cx="44" cy="43.5" r="2.2" fill={INK} />
      <circle cx="56" cy="43.5" r="2.2" fill={INK} />
      <circle cx="46.5" cy="52" r="1.6" fill={INK} />
      <circle cx="53.5" cy="52" r="1.6" fill={INK} />
      <path d="M45 56.5q5 3 10 0M35 50q-8 2-13 9M65 50q8 2 13 9" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  cupcake: (
    <>
      <path d="M50 14C58 14 86 60 84 72 82 84 18 84 16 72 14 60 42 14 50 14Z" fill={WASHI} {...line} />
      <rect x="36" y="58" width="28" height="26" rx="3" fill="#20402f" {...line} strokeWidth={3.5} />
      <path d="M38 44q4-4 8 0M54 44q4-4 8 0M45 50q5 4 10 0" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx="34" cy="50" r="4" fill="#ffb3c1" />
      <circle cx="66" cy="50" r="4" fill="#ffb3c1" />
    </>
  ),
  rainbow: (
    <>
      <circle cx="72" cy="30" r="13" fill={CRIMSON} {...line} strokeWidth={3.5} />
      <path d="M6 84 50 22 94 84Z" fill="#4f5fae" {...line} />
      <path d="M50 22 36.5 41 43 38 50 45 57 38 63.5 41Z" fill="#fff" {...line} strokeWidth={3} />
      <path d="M18 70h20M60 75h24" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
    </>
  ),
  notes: (
    <>
      <path d="M18 8 44 31M82 8 56 31" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M18 8 44 31M82 8 56 31" stroke={WOOD} strokeWidth={5} strokeLinecap="round" />
      <path d="M20 36C16 52 16 66 22 80H78C84 66 84 52 80 36Z" fill="#b0412e" {...line} />
      <ellipse cx="50" cy="80" rx="28" ry="7" fill="#8e3324" {...line} />
      <path d="M21 62Q50 71 79 62" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
      {[26, 38, 50, 62, 74].map((x) => (
        <circle key={x} cx={x} cy={x === 50 ? 52 : x === 38 || x === 62 ? 51 : 49} r="2.3" fill={GOLD} />
      ))}
      <ellipse cx="50" cy="36" rx="30" ry="10" fill="#f4e6c8" {...line} />
    </>
  ),
  icecream: (
    <>
      <path d="M50 3v12" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx="50" cy="52" rx="28" ry="31" fill={CRIMSON} {...line} />
      <ellipse cx="50" cy="52" rx="16" ry="22" fill="#ff6b5a" opacity={0.6} />
      <path d="M24 40Q50 47 76 40M22 52Q50 59 78 52M24 64Q50 71 76 64" fill="none" stroke={INK} strokeWidth={2} opacity={0.45} />
      <rect x="37" y="14" width="26" height="9" rx="2.5" fill={INK} />
      <rect x="37" y="80" width="26" height="8" rx="2.5" fill={INK} />
      <path d="M50 88v9" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  flower: (
    <>
      {[0, 72, 144, 216, 288].map((deg) => (
        <path key={deg} d={PETAL} transform={`rotate(${deg} 50 50)`} fill="#ffc1d6" {...line} strokeWidth={3.5} />
      ))}
      <circle cx="50" cy="50" r="11" fill="#ff8fb3" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <g key={deg} transform={`rotate(${deg + 36} 50 50)`}>
          <path d="M50 50V37" stroke="#c2185b" strokeWidth={2} strokeLinecap="round" />
          <circle cx="50" cy="36" r="2.2" fill={GOLD} />
        </g>
      ))}
      <circle cx="50" cy="50" r="4.5" fill={GOLD} stroke={INK} strokeWidth={2} />
    </>
  ),
  cool: (
    <>
      <path d="M50 67C46 56 58 50 52 40 48 34 40 34 36 30M54 47C62 43 66 41 70 34" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path d="M50 67C46 56 58 50 52 40 48 34 40 34 36 30M54 47C62 43 66 41 70 34" fill="none" stroke={WOOD} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx="33" cy="28" rx="16" ry="10" fill="#3f8f5a" {...line} strokeWidth={3.5} />
      <ellipse cx="71" cy="30" rx="15" ry="9" fill="#3f8f5a" {...line} strokeWidth={3.5} />
      <ellipse cx="52" cy="19" rx="15" ry="9" fill="#4fa86a" {...line} strokeWidth={3.5} />
      <path d="M26 25q6-4 12-1M64 27q5-3 10-1M46 16q5-3 10-1" fill="none" stroke="#9fd8a8" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M26 72H74L68 88H32Z" fill="#2b2f63" {...line} />
      <rect x="22" y="65" width="56" height="9" rx="3" fill="#3a3f86" {...line} />
    </>
  ),
  cat: (
    <>
      <path d="M28 88C24 66 30 54 50 54 70 54 76 66 72 88Z" fill={WASHI} {...line} />
      <path d="M34 30 36 13 47 22ZM72 30 70 13 59 22Z" fill={WASHI} {...line} strokeWidth={3.5} />
      <path d="M37 25 38 18 43 22ZM69 25 68 18 63 22Z" fill="#ffb3c1" />
      <ellipse cx="53" cy="38" rx="24" ry="19" fill={WASHI} {...line} />
      <path d="M63 22c6-2 11 2 10 8-5 0-9-2-10-8Z" fill="#ff9a3c" />
      <path d="M42 38q4-4 8 0M56 38q4-4 8 0" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M51 43h4l-2 3Z" fill="#ff7aa2" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M49 47q2 3 4 0 2 3 4 0M38 43H28M38 47l-9 3M68 43h10M68 47l9 3" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <path d="M33 57Q52 66 71 57" fill="none" stroke={CRIMSON} strokeWidth={6} strokeLinecap="round" />
      <circle cx="52" cy="63" r="5" fill={GOLD} stroke={INK} strokeWidth={2.5} />
      <path d="M27 62C19 52 18 40 24 33 31 28 38 34 36 46L35 60Z" fill={WASHI} {...line} />
      <path d="M24 38q3-3 6 0" fill="none" stroke="#ffb3c1" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  balloon: (
    <>
      {FAN.map(({ d, fill }) => (
        <path key={d} d={d} fill={fill} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      ))}
      <path d={`M${polar(50, 82, 46, 160).join(' ')}A46 46 0 0 1 ${polar(50, 82, 46, 20).join(' ')}`} fill="none" {...line} />
      <circle cx="68" cy="52" r="7" fill={GOLD} stroke={INK} strokeWidth={2} />
      <path d={`M50 82L${polar(50, 82, 16, 160).join(' ')}M50 82L${polar(50, 82, 16, 20).join(' ')}`} stroke={WOOD} strokeWidth={4} strokeLinecap="round" />
      <circle cx="50" cy="82" r="4.5" fill={GOLD} stroke={INK} strokeWidth={2.5} />
    </>
  ),
}


export function NinjaReward({ id, size, className = '' }: { id: StickerId; size: number; className?: string }) {
  const art = ART[id]
  if (!art) return null
  return (
    <svg className={`sticker ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={REWARD_NAMES[id]}>
      {art}
    </svg>
  )
}

/** A four-pointed throwing star, for the lightning dash's super-fast count. */
export function ThrowingStar({ size = 30 }: { size?: number }) {
  return (
    <svg className="sticker ninja-star" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g transform="rotate(15 50 50)">
        <path d="M50 4 61 39 96 50 61 61 50 96 39 61 4 50 39 39Z" fill="#c9cbd8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M50 14 56 42M86 50 58 56" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        <circle cx="50" cy="50" r="9" fill={INK} />
      </g>
    </svg>
  )
}

/** The small star on facts at black and gold belt. */
export function NinjaMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <polygon
        points="10,1 12.6,7 19,7.6 14.2,11.8 15.6,18.4 10,15 4.4,18.4 5.8,11.8 1,7.6 7.4,7"
        fill="currentColor"
        stroke={INK}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** An ink splash behind the cheer: a lumpy blob plus a few flicked drops. */
const SPLASH = (() => {
  const radii = [80, 66, 88, 70, 92, 64, 82, 72, 90, 62, 84, 74, 94, 66, 80, 70, 86, 68]
  const pts = radii.map((r, i) => {
    const a = (i / radii.length) * Math.PI * 2 - Math.PI / 2
    return [round(100 + r * Math.cos(a)), round(100 + r * 0.8 * Math.sin(a))] as const
  })
  const mid = (p: readonly number[], q: readonly number[]) => `${round((p[0] + q[0]) / 2)} ${round((p[1] + q[1]) / 2)}`
  let d = `M${mid(pts[pts.length - 1], pts[0])}`
  pts.forEach((p, i) => {
    d += `Q${p[0]} ${p[1]} ${mid(p, pts[(i + 1) % pts.length])}`
  })
  return `${d}Z`
})()

const DROPS = [
  [14, 52, 7],
  [190, 70, 6],
  [182, 156, 9],
  [24, 160, 5],
  [100, 6, 5],
  [160, 22, 4],
] as const

export function InkSplash() {
  return (
    <svg viewBox="0 0 200 200" className="burst-shape" aria-hidden="true">
      <path d={SPLASH} />
      {DROPS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  )
}

export function NinjaCover() {
  return (
    <>
      <NinjaReward id="flower" size={50} />
      <NinjaReward id="star" size={66} />
      <NinjaReward id="icecream" size={52} />
    </>
  )
}
