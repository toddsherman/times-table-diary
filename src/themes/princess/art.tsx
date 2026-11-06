import type { ReactNode } from 'react'
import type { StickerId } from '../../stickers'
import { line, P, REWARD_NAMES, thin } from './palette'
import { round, sparkle, star } from './shapes'

/** A small gold crown, w wide with its top left at (x, y): for the cake, the swan, the shield and the letterhead. */
export function LittleCrown({ x, y, w }: { x: number; y: number; w: number }) {
  const s = w / 20
  const pt = (px: number, py: number) => `${round(x + px * s)} ${round(y + py * s)}`
  return (
    <g>
      <path
        d={`M${pt(0, 12)}L${pt(1, 2)}L${pt(6, 7)}L${pt(10, 0)}L${pt(14, 7)}L${pt(19, 2)}L${pt(20, 12)}Z`}
        fill={P.gold}
        stroke={P.ink}
        strokeWidth={Math.max(1.6, 2.4 * s)}
        strokeLinejoin="round"
      />
      <circle cx={x + 10 * s} cy={y + 8.5 * s} r={1.9 * s} fill={P.rose} />
    </g>
  )
}

const ART: Record<StickerId, ReactNode> = {
  // Tiara: the picker tile's picture.
  star: (
    <>
      <path d={sparkle(15, 24, 8)} fill={P.gold} {...thin} strokeWidth={1.8} />
      <path d={sparkle(87, 18, 6)} fill={P.gold} {...thin} strokeWidth={1.8} />
      <path
        d="M10 74C11 62 14 53 19 45 24 52 30 56 36 54 40 42 44 30 50 20 56 30 60 42 64 54 70 56 76 52 81 45 86 53 89 62 90 74 64 84 36 84 10 74Z"
        fill={P.gold}
        {...line}
      />
      <path d="M22 54C26 60 32 63 38 61M78 54C74 60 68 63 62 61" fill="none" stroke={P.goldDark} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M44 44C46 36 48 31 50 28" fill="none" stroke={P.goldLight} strokeWidth={3} strokeLinecap="round" />
      <path d="M10 74C36 84 64 84 90 74L90 82C64 92 36 92 10 82Z" fill={P.goldDark} {...line} />
      <path d="M50 42C56 42 59 48 59 53 59 60 54 65 50 67 46 65 41 60 41 53 41 48 44 42 50 42Z" fill={P.rose} {...line} strokeWidth={3} />
      <path d="M46 49Q47 46 50 46" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx="26" cy="64" r="4.6" fill="#5aa8ee" {...thin} />
      <circle cx="74" cy="64" r="4.6" fill="#5aa8ee" {...thin} />
      <circle cx="50" cy="17" r="5" fill={P.rose} {...thin} />
      <circle cx="19" cy="43" r="4" fill={P.goldLight} {...thin} />
      <circle cx="81" cy="43" r="4" fill={P.goldLight} {...thin} />
      {[22, 36, 50, 64, 78].map((x) => (
        <circle key={x} cx={x} cy={x === 50 ? 85.5 : x === 36 || x === 64 ? 84.6 : 82.2} r="2.4" fill="#fff" stroke={P.ink} strokeWidth={1.4} />
      ))}
    </>
  ),

  // Castle
  heart: (
    <>
      <path d="M2 94C20 84 80 84 98 94L98 98H2Z" fill="#8fd08a" {...line} strokeWidth={3} />
      <rect x="10" y="40" width="20" height="50" fill="#efe4ff" {...line} />
      <rect x="70" y="40" width="20" height="50" fill="#efe4ff" {...line} />
      <path d="M26 56V48H31V52H37V48H42V52H48V48H52V52H58V48H63V52H69V48H74V56Z" fill="#e3d4fb" {...line} strokeWidth={3} />
      <rect x="26" y="55" width="48" height="35" fill="#e3d4fb" {...line} />
      <rect x="39" y="30" width="22" height="26" fill="#efe4ff" {...line} />
      <path d="M7 42 20 14 33 42Z" fill={P.purple} {...line} />
      <path d="M67 42 80 14 93 42Z" fill={P.purple} {...line} />
      <path d="M36 32 50 11 64 32Z" fill={P.rose} {...line} />
      <path d="M20 14V5M80 14V5M50 11V3" stroke={P.ink} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M20 5 29 8 20 11Z M80 5 89 8 80 11Z" fill={P.rose} {...thin} strokeWidth={1.8} />
      <path d="M50 3 59 6 50 9Z" fill={P.gold} {...thin} strokeWidth={1.8} />
      <path d="M44 90V76C44 70 56 70 56 76V90Z" fill="#8a5a3c" {...line} strokeWidth={3} />
      <path d="M50 72V90" stroke={P.ink} strokeWidth={2} />
      <path d="M17 66V60C17 56 23 56 23 60V66Z M77 66V60C77 56 83 56 83 60V66Z M47 48V42C47 38 53 38 53 42V48Z" fill="#ffd76a" {...thin} />
      <path d="M31 74V68C31 65 36 65 36 68V74Z M64 74V68C64 65 69 65 69 68V74Z" fill="#ffd76a" {...thin} />
      <path d={sparkle(92, 58, 4)} fill={P.gold} />
    </>
  ),

  // Throne
  crown: (
    <>
      <path d="M27 66V26C27 12 38 6 50 6S73 12 73 26V66Z" fill={P.gold} {...line} />
      <path d="M34 62V28C34 18 41 13 50 13S66 18 66 28V62Z" fill={P.purple} {...line} strokeWidth={3} />
      <path d="M41 24C42 20 45 18 48 17" fill="none" stroke="#9a78d8" strokeWidth={3} strokeLinecap="round" />
      <LittleCrown x={41} y={26} w={18} />
      <path d="M43 46h14M43 54h14" stroke="#8b64cf" strokeWidth={2} strokeLinecap="round" />
      <rect x="15" y="50" width="12" height="22" rx="5" fill={P.gold} {...line} strokeWidth={3} />
      <rect x="73" y="50" width="12" height="22" rx="5" fill={P.gold} {...line} strokeWidth={3} />
      <circle cx="21" cy="48" r="5" fill={P.goldLight} {...thin} />
      <circle cx="79" cy="48" r="5" fill={P.goldLight} {...thin} />
      <path d="M20 66C20 60 24 58 30 58H70C76 58 80 60 80 66V70C80 74 77 76 72 76H28C23 76 20 74 20 70Z" fill={P.rose} {...line} />
      <path d="M28 63H60" stroke="#ff9cc4" strokeWidth={3} strokeLinecap="round" />
      <rect x="24" y="75" width="52" height="10" rx="2" fill={P.goldDark} {...line} strokeWidth={3} />
      <path d="M28 85V95H35V85M65 85V95H72V85" fill={P.goldDark} {...line} strokeWidth={3} />
    </>
  ),

  // Pet dragon: small, friendly, and very proud of its puff of smoke.
  bolt: (
    <>
      <path d="M36 84C20 90 6 84 8 70 9 62 16 60 21 63 15 66 14 74 22 76 28 77 32 74 36 72Z" fill="#48b98e" {...line} strokeWidth={3} />
      <path d="M8 70 2 66 6 76Z" fill="#48b98e" {...thin} />
      <path d="M40 50C26 40 22 26 28 14 34 24 42 26 46 26 46 18 50 12 56 10 54 22 56 34 52 46Z" fill="#c9b5f5" {...line} strokeWidth={3} />
      <path d="M34 24 40 40M44 30 48 44" stroke="#9c84d6" strokeWidth={2} strokeLinecap="round" />
      <path d="M30 92C24 70 30 52 46 46 62 42 74 52 74 70 74 82 70 90 66 92Z" fill="#48b98e" {...line} />
      <path d="M40 90C37 76 40 62 50 58 60 56 66 64 64 76 63 84 61 88 59 90Z" fill="#fff2c8" {...thin} />
      <path d="M41 70H63M40 78H63M42 85H61" stroke="#e5c97f" strokeWidth={2} strokeLinecap="round" />
      <ellipse cx="34" cy="92" rx="9" ry="5" fill="#48b98e" {...thin} />
      <ellipse cx="66" cy="92" rx="9" ry="5" fill="#48b98e" {...thin} />
      <path d="M54 22 51 9 61 18Z M68 18 71 6 76 19Z" fill={P.gold} {...thin} />
      <ellipse cx="64" cy="33" rx="19" ry="16" fill="#48b98e" {...line} />
      <ellipse cx="80" cy="40" rx="11" ry="9" fill="#5ccc9f" {...line} strokeWidth={3} />
      <circle cx="80" cy="37" r="1.6" fill={P.ink} />
      <circle cx="86" cy="38" r="1.6" fill={P.ink} />
      <circle cx="61" cy="30" r="6" fill={P.ink} />
      <circle cx="63" cy="28" r="2.2" fill="#fff" />
      <ellipse cx="58" cy="41" rx="4" ry="2.6" fill="#ff9cc4" />
      <path d="M72 46Q76 49 80 47" fill="none" stroke={P.ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M88 24C88 20 93 19 94 23 95 19 100 20 99 24 98 28 94 30 93.5 32 93 30 88 28 88 24Z" fill={P.rose} stroke={P.ink} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="90" cy="31" r="2" fill="#f5eefc" stroke={P.inkSoft} strokeWidth={1.2} />
    </>
  ),

  // Royal cake
  cupcake: (
    <>
      <ellipse cx="50" cy="91" rx="42" ry="6" fill={P.gold} {...line} strokeWidth={3} />
      <rect x="14" y="64" width="72" height="25" rx="4" fill="#ffb8d2" {...line} />
      <path d="M14 70C20 70 20 76 26 76S32 70 38 70 44 76 50 76 56 70 62 70 68 76 74 76 80 70 86 70V67C86 65 85 64 83 64H17C15 64 14 65 14 67Z" fill="#fff" {...thin} />
      <rect x="25" y="45" width="50" height="21" rx="4" fill="#d9c6ff" {...line} />
      <path d="M25 50C30 50 30 56 35 56S40 50 45 50 50 56 55 56 60 50 65 50 70 56 75 56V48C75 46 74 45 72 45H28C26 45 25 46 25 48Z" fill="#fff" {...thin} />
      <rect x="35" y="28" width="30" height="19" rx="4" fill="#fff6e0" {...line} />
      <path d="M35 33C39 33 39 37 43 37S47 33 50 33 53 37 57 37 61 33 65 33V31C65 29 64 28 62 28H38C36 28 35 29 35 31Z" fill={P.blush} {...thin} />
      <LittleCrown x={40} y={14} w={20} />
      {[22, 32, 42, 52, 62, 72, 80].map((x) => (
        <circle key={x} cx={x} cy={83} r="2.2" fill="#fff" stroke={P.ink} strokeWidth={1.2} />
      ))}
      {[33, 43, 53, 63].map((x) => (
        <circle key={x} cx={x + 2} cy={61} r="2.4" fill={P.rose} />
      ))}
      <path d={sparkle(88, 40, 5)} fill={P.gold} {...thin} strokeWidth={1.4} />
      <path d={sparkle(12, 50, 4)} fill={P.gold} {...thin} strokeWidth={1.4} />
    </>
  ),

  // Unicorn
  rainbow: (
    <>
      <path d="M66 22C80 22 88 34 88 48 88 62 84 80 86 96H56C58 84 62 74 60 64Z" fill="#c9b5f5" {...line} strokeWidth={3} />
      <path d="M66 22C78 26 82 40 78 54 76 64 74 76 76 96H66C66 84 68 72 66 60Z" fill="#ff9cc4" {...thin} />
      <path d="M58 96C56 82 54 72 50 66 44 62 34 64 26 62 16 60 12 52 14 44 16 36 26 30 38 28 52 26 64 32 68 44 72 58 70 78 72 96Z" fill="#fff" {...line} />
      <path d="M40 30 34 4 50 28Z" fill={P.gold} {...line} strokeWidth={3} />
      <path d="M37 22 46 19M36 15 43 13" stroke={P.goldDark} strokeWidth={2} strokeLinecap="round" />
      <path d="M54 30 58 15 64 33Z" fill="#fff" {...line} strokeWidth={3} />
      <path d="M57 26 59 20" stroke="#ff9cc4" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M48 30C56 26 66 30 66 40 60 36 54 38 50 36 52 42 48 46 44 46 46 40 42 34 48 30Z" fill="#9adcf5" {...thin} />
      <path d="M36 44Q41 48 46 44" fill="none" stroke={P.ink} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M38 47 36 50M42 48.5V52M45.5 47 47.5 50" stroke={P.ink} strokeWidth={1.8} strokeLinecap="round" />
      <ellipse cx="34" cy="54" rx="5" ry="3" fill="#ffc2da" />
      <path d="M17 50Q19 52 21 50" fill="none" stroke={P.ink} strokeWidth={2} strokeLinecap="round" />
      <path d={sparkle(14, 20, 6)} fill={P.gold} {...thin} strokeWidth={1.6} />
      <path d={sparkle(24, 82, 5)} fill="#9adcf5" {...thin} strokeWidth={1.4} />
    </>
  ),

  // Telescope, for a princess who explores the stars
  notes: (
    <>
      <path d={star(80, 16, 9)} fill={P.gold} {...thin} />
      <path d={sparkle(58, 12, 5)} fill={P.gold} {...thin} strokeWidth={1.4} />
      <path d={sparkle(92, 40, 4)} fill={P.gold} {...thin} strokeWidth={1.4} />
      <path d="M48 62 28 96M52 62 72 96M50 62V96" stroke={P.ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M48 62 28 96M52 62 72 96M50 62V96" stroke="#b07a4f" strokeWidth={3.6} strokeLinecap="round" />
      <g transform="rotate(-32 50 58)">
        <rect x="8" y="51" width="12" height="13" rx="2" fill={P.goldDark} {...line} strokeWidth={3} />
        <rect x="18" y="48" width="46" height="19" rx="3" fill={P.purple} {...line} />
        <rect x="62" y="44" width="26" height="27" rx="4" fill={P.gold} {...line} />
        <path d="M30 48V67M42 48V67" stroke={P.gold} strokeWidth={4} />
        <path d="M22 53H58" stroke="#9a78d8" strokeWidth={2.6} strokeLinecap="round" />
        <path d="M66 50V64" stroke={P.goldLight} strokeWidth={3} strokeLinecap="round" />
        <rect x="86" y="47" width="5" height="21" rx="2" fill="#bfe3ff" {...thin} />
      </g>
      <circle cx="50" cy="61" r="5" fill={P.goldDark} {...thin} />
    </>
  ),

  // Carriage
  icecream: (
    <>
      <path d="M12 66H88" stroke={P.ink} strokeWidth={8} strokeLinecap="round" />
      <path d="M12 66H88" stroke={P.goldDark} strokeWidth={4} strokeLinecap="round" />
      <path d="M20 66C16 50 18 36 26 30H74C82 36 84 50 80 66Z" fill="#ffb8d2" {...line} />
      <path d="M26 30C28 26 32 24 36 24H64C68 24 72 26 74 30Z" fill={P.purple} {...line} strokeWidth={3} />
      <LittleCrown x={40} y={10} w={20} />
      <path d="M33 36H48V56H33Z M52 36H67V56H52Z" fill="#cfeaff" {...line} strokeWidth={3} />
      <path d="M36 50 44 40M55 50 63 40" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M22 60H78" stroke={P.gold} strokeWidth={3} strokeLinecap="round" />
      <circle cx="28" cy="80" r="14" fill={P.gold} {...line} />
      <circle cx="72" cy="80" r="14" fill={P.gold} {...line} />
      <circle cx="28" cy="80" r="9" fill="#fff6e0" {...thin} />
      <circle cx="72" cy="80" r="9" fill="#fff6e0" {...thin} />
      <path d="M28 71V89M19 80H37M22 74 34 86M34 74 22 86M72 71V89M63 80H81M66 74 78 86M78 74 66 86" stroke={P.goldDark} strokeWidth={2} />
      <circle cx="28" cy="80" r="3" fill={P.rose} {...thin} strokeWidth={1.5} />
      <circle cx="72" cy="80" r="3" fill={P.rose} {...thin} strokeWidth={1.5} />
    </>
  ),

  // Rose garden
  flower: (
    <>
      <path d="M4 94H96" stroke={P.ink} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M10 92C4 78 10 64 22 62 22 48 36 42 46 46 52 34 68 36 72 46 84 44 94 56 88 68 96 76 92 90 86 92Z" fill="#3f9a5c" {...line} />
      <path d="M24 70C30 66 36 68 38 72M62 80C68 76 74 78 76 82M50 62C54 58 60 60 60 64" fill="none" stroke="#2b7343" strokeWidth={2.4} strokeLinecap="round" />
      {(
        [
          [30, 60, 10, '#e5427f'],
          [56, 50, 11, '#ff7aa8'],
          [76, 66, 10, '#e5427f'],
          [46, 78, 9, '#ff9cc4'],
          [20, 82, 7, '#ff7aa8'],
        ] as const
      ).map(([cx, cy, r, fill]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} fill={fill} {...line} strokeWidth={3} />
          <path
            d={`M${cx} ${cy}m-${round(r * 0.35)} 0a${round(r * 0.35)} ${round(r * 0.35)} 0 1 1 ${round(r * 0.5)} ${round(r * 0.3)}M${cx} ${round(cy - r * 0.72)}c${round(r * 0.6)} ${round(r * 0.1)} ${round(r * 0.8)} ${round(r * 0.7)} ${round(r * 0.5)} ${round(r * 1.1)}M${round(cx - r * 0.7)} ${round(cy + r * 0.1)}c${round(r * 0.1)} ${round(r * 0.5)} ${round(r * 0.6)} ${round(r * 0.75)} ${round(r * 1.05)} ${round(r * 0.6)}`}
            fill="none"
            stroke="#a3174d"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </g>
      ))}
      <path d={sparkle(86, 30, 5)} fill={P.gold} {...thin} strokeWidth={1.4} />
      <path d={sparkle(14, 40, 4)} fill={P.gold} {...thin} strokeWidth={1.4} />
    </>
  ),

  // Shield, for a brave princess
  cool: (
    <>
      <path d="M50 6 86 17V46C86 70 70 86 50 95 30 86 14 70 14 46V17Z" fill={P.gold} {...line} />
      <path d="M50 14 22 23V46C22 65 34 78 50 86Z" fill={P.purple} />
      <path d="M50 14 78 23V46C78 65 66 78 50 86Z" fill={P.rose} />
      <path d="M50 14 78 23V46C78 65 66 78 50 86 34 78 22 65 22 46V23Z" fill="none" stroke={P.ink} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M50 14V86" stroke={P.ink} strokeWidth={2} />
      <LittleCrown x={34} y={30} w={32} />
      <path d={star(50, 66, 9)} fill={P.goldLight} {...thin} />
      <path d="M28 28 34 26M28 36V44" stroke="#9a78d8" strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),

  // Swan, wearing a very small crown
  cat: (
    <>
      <path d="M6 88C16 84 22 92 32 88S48 84 58 88 74 92 84 88 94 86 96 88" fill="none" stroke="#5aa8ee" strokeWidth={4} strokeLinecap="round" />
      <path d="M64 64C58 50 56 38 60 28 63 20 70 16 76 18" fill="none" stroke={P.ink} strokeWidth={13} strokeLinecap="round" />
      <path d="M64 64C58 50 56 38 60 28 63 20 70 16 76 18" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
      <path d="M16 70C18 58 32 54 46 58 56 60 64 66 72 66 80 66 84 60 88 56 92 70 84 82 70 84 52 88 30 88 20 82 16 78 16 74 16 70Z" fill="#fff" {...line} />
      <path d="M26 66C34 60 46 60 54 66 46 66 40 70 36 76 32 72 28 70 26 66Z" fill="#ece4ff" {...thin} />
      <path d="M32 72C38 70 44 72 48 76" fill="none" stroke="#c9b5f5" strokeWidth={2} strokeLinecap="round" />
      <circle cx="74" cy="21" r="9" fill="#fff" {...line} strokeWidth={3} />
      <path d="M81 19 92 25 81 28Z" fill="#ff9a3c" {...thin} />
      <circle cx="75" cy="19" r="2" fill={P.ink} />
      <LittleCrown x={66} y={4} w={14} />
    </>
  ),

  // Magic wand
  balloon: (
    <>
      <path d="M22 90 54 46" stroke={P.ink} strokeWidth={11} strokeLinecap="round" />
      <path d="M22 90 54 46" stroke="#c9b5f5" strokeWidth={5.5} strokeLinecap="round" />
      <path d="M26 82 30 77M36 68 40 63" stroke={P.gold} strokeWidth={4} strokeLinecap="round" />
      <path d="M50 50C42 56 34 56 30 52 36 50 42 48 48 46Z" fill={P.rose} {...thin} />
      <path d="M52 52C52 62 46 68 40 70 44 64 46 58 48 52Z" fill="#ff9cc4" {...thin} />
      <path d={star(64, 33, 25, 11)} fill={P.gold} {...line} />
      <path d="M58 24 62 20" stroke={P.goldLight} strokeWidth={3} strokeLinecap="round" />
      <path d={sparkle(92, 60, 6)} fill={P.gold} {...thin} strokeWidth={1.6} />
      <path d={sparkle(30, 18, 5)} fill="#9adcf5" {...thin} strokeWidth={1.6} />
      <path d={sparkle(86, 84, 4)} fill="#ff9cc4" {...thin} strokeWidth={1.4} />
    </>
  ),
}

export function PrincessReward({ id, size, className = '' }: { id: StickerId; size: number; className?: string }) {
  const art = ART[id]
  if (!art) return null
  return (
    <svg className={`sticker ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={REWARD_NAMES[id]}>
      {art}
    </svg>
  )
}

/** A shooting star, for the unicorn gallop's super-fast count. */
export function ShootingStar({ size = 30 }: { size?: number }) {
  return (
    <svg className="sticker princess-shooting-star" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M8 70 46 52M14 88 50 64M30 94 58 72" stroke={P.rose} strokeWidth={7} strokeLinecap="round" />
      <path d="M8 70 46 52M14 88 50 64M30 94 58 72" stroke="#ffc2da" strokeWidth={3} strokeLinecap="round" />
      <path d={star(64, 40, 32, 14)} fill={P.gold} {...line} strokeWidth={5} />
      <path d="M58 30 62 25" stroke={P.goldLight} strokeWidth={4} strokeLinecap="round" />
    </svg>
  )
}

/** The small sparkle on facts at the top two levels, in the grid and the legend. */
export function PrincessMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <path d={sparkle(10, 10, 9.2)} fill="currentColor" stroke={P.ink} strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  )
}

/** A scalloped royal rosette behind the cheer, with a few sparkles flying off it. */
const ROSETTE = (() => {
  const bumps = 26
  const pts = Array.from({ length: bumps }, (_, i) => {
    const a = (i / bumps) * Math.PI * 2 - Math.PI / 2
    return [round(100 + 86 * Math.cos(a)), round(100 + 68 * Math.sin(a))] as const
  })
  let d = `M${pts[0][0]} ${pts[0][1]}`
  pts.forEach((_, i) => {
    const [x, y] = pts[(i + 1) % bumps]
    const [px, py] = pts[i]
    const mx = (px + x) / 2
    const my = (py + y) / 2
    // Push each scallop's control point outward from the center.
    const k = 1.1
    d += `Q${round(100 + (mx - 100) * k)} ${round(100 + (my - 100) * k)} ${x} ${y}`
  })
  return `${d}Z`
})()

export function RoyalRosette() {
  return (
    <svg viewBox="0 0 200 200" className="burst-shape royal-rosette" aria-hidden="true">
      <path d={ROSETTE} />
      <ellipse cx="100" cy="100" rx="72" ry="55" fill="none" strokeWidth={2.5} strokeDasharray="7 6" opacity={0.55} />
      <path d={sparkle(16, 40, 12)} />
      <path d={sparkle(186, 52, 10)} />
      <path d={sparkle(176, 168, 13)} />
      <path d={sparkle(26, 162, 9)} />
    </svg>
  )
}

export function PrincessCover() {
  return (
    <>
      <PrincessReward id="heart" size={70} />
      <PrincessReward id="star" size={60} />
      <PrincessReward id="rainbow" size={66} />
    </>
  )
}
