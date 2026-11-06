import type { ReactNode } from 'react'
import type { StickerId } from '../../stickers'
import { Bone, PupHead, Twinkle } from './pup-art'
import { BLUE, GOLD, INK, PUPS, RED, REWARD_NAMES } from './pups'

const line = { stroke: INK, strokeWidth: 3.2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const CREAM = '#fff4df'
const KIBBLE = '#b8763e'

/** A paw print centered on (x, y); `s` is its height. */
export const PawPrint = ({ x, y, s, fill = INK }: { x: number; y: number; s: number; fill?: string }) => {
  const k = s / 20
  return (
    <g transform={`translate(${x - 10 * k} ${y - 10 * k}) scale(${k})`} fill={fill}>
      <ellipse cx="10" cy="13.5" rx="5" ry="4.3" />
      <ellipse cx="3.8" cy="8.6" rx="2.2" ry="2.6" transform="rotate(-20 3.8 8.6)" />
      <ellipse cx="7.8" cy="4.4" rx="2.2" ry="2.7" />
      <ellipse cx="12.2" cy="4.4" rx="2.2" ry="2.7" />
      <ellipse cx="16.2" cy="8.6" rx="2.2" ry="2.6" transform="rotate(20 16.2 8.6)" />
    </g>
  )
}

const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.55}C${x - s * 0.9} ${y - s * 0.05} ${x - s * 0.55} ${y - s * 0.75} ${x} ${y - s * 0.3}C${x + s * 0.55} ${y - s * 0.75} ${x + s * 0.9} ${y - s * 0.05} ${x} ${y + s * 0.55}Z`

/** The rope toy's twisted stripes, as slanted bands across the rope. */
const ROPE_BANDS = Array.from({ length: 8 }, (_, i) => {
  const x = 25 + i * 6.6
  return { d: `M${x} 41L${x + 6.6} 41L${x + 1.6} 59L${x - 5} 59Z`, fill: [RED, '#fff8ea', BLUE, '#fff8ea'][i % 4] }
})

const ART: Record<StickerId, ReactNode> = {
  // The picker tile's picture: Biscuit says hi.
  star: (
    <>
      <g transform="translate(50 55) scale(1.42) translate(-50 -38.5)">
        <PupHead pup={PUPS[0]} mood="happy" />
      </g>
      <path d={heart(86, 16, 13)} fill={RED} {...line} strokeWidth={2.4} />
    </>
  ),
  heart: (
    <>
      <ellipse cx="50" cy="90" rx="24" ry="4" fill={INK} opacity={0.15} />
      <circle cx="50" cy="52" r="31" fill="#d6ea4a" />
      <path d="M30.1 28.3C42 40 42 64 30.1 75.7M69.9 28.3C58 40 58 64 69.9 75.7" fill="none" stroke="#fffbe8" strokeWidth={4.6} strokeLinecap="round" />
      <path d="M33 36C37 30.5 43 27.5 49 27" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3.4} strokeLinecap="round" />
      <circle cx="50" cy="52" r="31" fill="none" {...line} />
    </>
  ),
  crown: (
    <>
      <ellipse cx="50" cy="88" rx="42" ry="6" fill="#7cc45a" {...line} strokeWidth={2.6} />
      <rect x="24" y="46" width="52" height="41" fill="#5aa7e6" {...line} />
      <path d="M24 59H76M24 72H76" stroke={INK} strokeOpacity={0.22} strokeWidth={2} />
      <path d="M37 87V70C37 60.5 63 60.5 63 70V87Z" fill="#5b3a2b" {...line} />
      <path d="M11 53L50 16L89 53" fill={RED} {...line} strokeWidth={3.4} />
      <path d="M25 40L50 17M75 40L50 17" stroke="#fff" strokeOpacity={0.35} strokeWidth={2.4} strokeLinecap="round" />
      <path d={heart(50, 39, 12)} fill={CREAM} {...line} strokeWidth={2.4} />
      <Bone x={50} y={56} length={14} r={3.4} fill={GOLD} width={2} />
    </>
  ),
  bolt: (
    <>
      <path d="M6 40h13M4 52h14M8 64h11" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      <g transform="rotate(-14 57 54)">
        <ellipse cx="57" cy="58" rx="37" ry="13.5" fill="#1f6fb3" {...line} />
        <ellipse cx="57" cy="52" rx="37" ry="13.5" fill="#4fa8ee" {...line} />
        <ellipse cx="57" cy="52" rx="24" ry="8" fill="none" stroke="#c9e7ff" strokeWidth={2.6} />
        <PawPrint x={57} y={52} s={10} fill="#fff" />
      </g>
    </>
  ),
  cupcake: (
    <>
      <path d="M28 58L34 90H66L72 58Z" fill="#ff9fb8" {...line} />
      <path d="M38.5 58l2.4 32M46.5 58l1 32M53.5 58l-1 32M61.5 58l-2.4 32" stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
      <path
        d="M23 61C16.5 61 16.5 50 24 48.5C22 39 33 34 39.5 39C42 29.5 58 29.5 60.5 39C67 34 78 39 76 48.5C83.5 50 83.5 61 77 61Z"
        fill="#fff6ec"
        {...line}
      />
      <path d="M31 50l3-2M45 44l3 1M58 49l2 3M67 46l3-1M38 56l3 1M52 55l3-2M64 56l2 2" stroke={RED} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M41 47l1 3M54 41l-2 2M70 53l-3 1" stroke={BLUE} strokeWidth={2.6} strokeLinecap="round" />
      <g transform="rotate(-14 50 30)">
        <Bone x={50} y={30} length={20} r={4.6} fill="#f2c98a" width={2.6} />
      </g>
    </>
  ),
  rainbow: (
    <g transform="rotate(-38 50 50)">
      <rect x="22" y="41" width="56" height="18" rx="6" fill="#fff8ea" />
      {ROPE_BANDS.map((b) => (
        <path key={b.d} d={b.d} fill={b.fill} />
      ))}
      <rect x="22" y="41" width="56" height="18" rx="6" fill="none" {...line} />
      <path d="M10 45 1 38M9 50H-1M10 55 1 62M90 45 99 38M91 50H101M90 55 99 62" stroke={RED} strokeWidth={3.4} strokeLinecap="round" />
      <circle cx="16" cy="50" r="11" fill={RED} {...line} />
      <circle cx="84" cy="50" r="11" fill={BLUE} {...line} />
      <path d="M11 44C14.5 46 14.5 54 11 56M89 44C85.5 46 85.5 54 89 56" fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={1.8} />
    </g>
  ),
  notes: (
    <>
      <ellipse cx="53" cy="88" rx="32" ry="4.5" fill={INK} opacity={0.14} />
      <path
        d="M20 62C20 51 30 46 43 50C39 43 39 30 53 26.5C67 23 77 33 73 44C71.5 48 68 50.5 65 52C75 50 86 53 86 64C86 78 72 86 53 86C34 86 20 78 20 62Z"
        fill="#ffd43b"
        {...line}
      />
      <path d="M71 39.5C78 37.5 87 40.5 88 44C85 47.5 77 48.5 70 46Z" fill="#ff8a2a" {...line} strokeWidth={2.6} />
      <circle cx="61" cy="36" r="3.4" fill={INK} />
      <circle cx="62.2" cy="34.8" r="1.2" fill="#fff" />
      <path d="M38 64C44 57.5 57 59.5 61 68C55 74.5 44 73 38 64Z" fill="#ffc21a" {...line} strokeWidth={2.4} />
      <path d="M14 44 8 39M12 52H5M17 36 13 30" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
    </>
  ),
  icecream: (
    <>
      <ellipse cx="50" cy="57" rx="36" ry="7" fill="#7a2a22" {...line} strokeWidth={2.6} />
      {[
        [34, 53, 6, KIBBLE],
        [45, 49, 6.5, '#9a5d2c'],
        [57, 50, 6.2, KIBBLE],
        [67, 54, 5.6, '#9a5d2c'],
        [40, 44, 5.6, '#9a5d2c'],
        [52, 41, 6, KIBBLE],
        [62, 44.5, 5.4, KIBBLE],
        [47, 35, 5, KIBBLE],
        [57, 34, 4.6, '#9a5d2c'],
      ].map(([x, y, r, fill]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={fill as string} stroke={INK} strokeWidth={2} />
      ))}
      <path d="M13 57C13 61 30 64.5 50 64.5C70 64.5 87 61 87 57L79 82C77.5 86.5 73 88.5 68 88.5H32C27 88.5 22.5 86.5 21 82Z" fill={RED} {...line} />
      <path d="M17 66C30 70 70 70 83 66" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2.6} strokeLinecap="round" />
      <Bone x={50} y={77} length={16} r={3.8} fill={CREAM} width={2.2} />
    </>
  ),
  flower: (
    <>
      <path d="M14 31C38 38 62 38 86 31L55 84C53 87.5 47 87.5 45 84Z" fill={RED} {...line} />
      {[
        [32, 46],
        [50, 47],
        [68, 46],
        [41, 59],
        [59, 59],
        [50, 72],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" fill="#fff" />
      ))}
      <path d="M14 31C38 38 62 38 86 31L84 39.5C62 45.5 38 45.5 16 39.5Z" fill="#b8302a" {...line} strokeWidth={2.6} />
      <path d="M15 33C9 28 3 31 5 37.5C9 37 12.5 36 15.5 35ZM15.5 35C10 39 9 45 13 47C15 43.5 16 39.5 16.5 37Z" fill={RED} {...line} strokeWidth={2.4} />
      <path d="M85 33C91 28 97 31 95 37.5C91 37 87.5 36 84.5 35ZM84.5 35C90 39 91 45 87 47C85 43.5 84 39.5 83.5 37Z" fill={RED} {...line} strokeWidth={2.4} />
    </>
  ),
  cool: (
    <>
      <ellipse cx="50" cy="38" rx="35" ry="18" fill="none" stroke={INK} strokeWidth={14} />
      <ellipse cx="50" cy="38" rx="35" ry="18" fill="none" stroke="#3a8de0" strokeWidth={8} />
      {[24, 37, 63, 76].map((x) => (
        <circle key={x} cx={x} cy={x < 30 || x > 70 ? 50.5 : 54.5} r="2.2" fill="#e6eef6" stroke={INK} strokeWidth={1.4} />
      ))}
      <rect x="77" y="30" width="11" height="16" rx="2.5" fill={GOLD} {...line} strokeWidth={2.6} />
      <rect x="80.5" y="34" width="4" height="8" rx="1" fill="#3a8de0" />
      <circle cx="50" cy="61" r="3.6" fill="none" stroke={INK} strokeWidth={2.6} />
      <path d={heart(50, 78, 30)} fill={GOLD} {...line} />
      <PawPrint x={50} y={77} s={11} fill="#c98a1a" />
      <path d="M40 70C41.5 67.5 44 66 46.5 66" fill="none" stroke="#fff6cc" strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
  cat: (
    <>
      <ellipse cx="50" cy="86" rx="32" ry="4.5" fill={INK} opacity={0.14} />
      <g transform="rotate(-30 50 50)">
        <Bone x={50} y={50} length={46} r={12} fill="#fff1d8" width={3.2} />
        <path d="M33 45H66" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />
      </g>
      <Twinkle x={84} y={20} s={6} />
      <Twinkle x={16} y={78} s={4.5} />
    </>
  ),
  balloon: (
    <>
      <path d="M26 34H74V82C74 87 70 90 65 90H35C30 90 26 87 26 82Z" fill="#e4f4ff" />
      <g transform="rotate(-18 40 74)">
        <Bone x={40} y={74} length={13} r={4} fill="#d79a52" width={2.2} />
      </g>
      <g transform="rotate(24 61 76)">
        <Bone x={61} y={76} length={13} r={4} fill="#c98444" width={2.2} />
      </g>
      <g transform="rotate(8 52 44)">
        <Bone x={52} y={44} length={13} r={4} fill="#d79a52" width={2.2} />
      </g>
      <rect x="33" y="52" width="34" height="17" rx="5" fill={CREAM} {...line} strokeWidth={2.4} />
      <PawPrint x={50} y={60.5} s={11} fill={RED} />
      <path d="M31 40V80" stroke="#fff" strokeOpacity={0.8} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M26 34H74V82C74 87 70 90 65 90H35C30 90 26 87 26 82Z" fill="none" {...line} />
      <rect x="22" y="22" width="56" height="13" rx="4.5" fill={RED} {...line} />
      <rect x="41" y="13" width="18" height="10" rx="3.5" fill={RED} {...line} />
    </>
  ),
}

export function PuppyReward({ id, size, className = '' }: { id: StickerId; size: number; className?: string }) {
  const art = ART[id]
  if (!art) return null
  return (
    <svg className={`sticker pup-reward ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={REWARD_NAMES[id]}>
      {art}
    </svg>
  )
}
