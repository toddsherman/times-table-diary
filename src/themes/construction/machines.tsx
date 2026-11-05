import type { StickerId } from '../../stickers'
import { MACHINES } from './fleet'
import { C, line } from './palette'

export function Machine({ id, size, className = '' }: { id: StickerId; size: number; className?: string }) {
  const machine = MACHINES[id]
  if (!machine) return null
  return (
    <svg className={`sticker machine ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={machine.name}>
      {machine.art}
    </svg>
  )
}

export function Cone({ size }: { size: number }) {
  return (
    <svg className="sticker cone" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect x={18} y={82} width={64} height={10} rx={3} fill={C.orange} {...line} />
      <path d="M40 14h20l16 68H24Z" fill={C.orange} {...line} />
      <path d="M35 36h30l4 16H31Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M29 62h42" stroke={C.white} strokeWidth={7} />
    </svg>
  )
}

/** A yellow warning diamond with a lightning bolt: the speed run's super-fast counter. */
export function FastSign({ size = 30 }: { size?: number }) {
  return (
    <svg className="sticker fast-sign" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M50 5 95 50 50 95 5 50Z" fill={C.yellow} {...line} strokeWidth={5} />
      <path d="M56 22 34 54h14l-6 26 24-34H52Z" fill={C.ink} />
    </svg>
  )
}

export function Star({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <path d="M10 1.5 12.6 7l6 .7-4.5 4.1 1.2 5.9L10 14.8l-5.3 2.9 1.2-5.9L1.4 7.7l6-.7Z" fill="currentColor" />
    </svg>
  )
}

/** A road-work sign with bolts and striped ends, behind the cheer after a right answer. */
export function SignBurst() {
  return (
    <svg viewBox="0 0 240 120" className="burst-shape sign-burst" aria-hidden="true">
      <rect x={6} y={8} width={228} height={104} rx={14} style={{ fill: 'var(--sign, #ffc400)' }} stroke={C.ink} strokeWidth={6} />
      <rect x={18} y={20} width={204} height={80} rx={8} fill="none" stroke={C.ink} strokeWidth={3} />
      {[
        [26, 28],
        [214, 28],
        [26, 92],
        [214, 92],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={C.ink} />
      ))}
    </svg>
  )
}
