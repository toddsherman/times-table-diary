import { PuppyArt } from './pup-art'
import { INK } from './pups'

/** Three puppies on the welcome cover. */
export function Cover() {
  return (
    <>
      <PuppyArt table={1} stage={2} size={84} />
      <PuppyArt table={2} stage={3} size={108} />
      <PuppyArt table={4} stage={2} size={84} />
    </>
  )
}

/** A tennis ball zooming along, next to the zoomies' super-fast count. */
export function FastIcon() {
  return (
    <svg className="pup-fast" viewBox="0 0 40 30" width={40} height={30} aria-hidden="true">
      <path d="M2 9h10M1 15h9M3 21h9" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx="27" cy="15" r="11" fill="#d6ea4a" />
      <path d="M20 7C24.5 11 24.5 19 20 23M34 7C29.5 11 29.5 19 34 23" fill="none" stroke="#fffbe8" strokeWidth={2} strokeLinecap="round" />
      <circle cx="27" cy="15" r="11" fill="none" stroke={INK} strokeWidth={2.2} />
    </svg>
  )
}

/** A little bone, on facts that are Top dog or Best in show. */
export function Mark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <g transform="rotate(-35 10 10)">
        <path
          d="M5.6 7.2H14.4A2.6 2.6 0 1 1 17 10A2.6 2.6 0 1 1 14.4 12.8H5.6A2.6 2.6 0 1 1 3 10A2.6 2.6 0 1 1 5.6 7.2Z"
          fill="currentColor"
          stroke={INK}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/** A big bone behind the cheer: every outline first, then every fill, so only its edge shows. */
const KNOBS = [
  [36, 34],
  [36, 86],
  [204, 34],
  [204, 86],
] as const

export function BurstShape() {
  const shape = (
    <>
      {KNOBS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={27} />
      ))}
      <rect x={36} y={30} width={168} height={60} rx={6} />
    </>
  )
  return (
    <svg viewBox="0 0 240 120" className="burst-shape bone-burst" aria-hidden="true">
      <g className="bone-edge">{shape}</g>
      <g className="bone-fill">{shape}</g>
    </svg>
  )
}
