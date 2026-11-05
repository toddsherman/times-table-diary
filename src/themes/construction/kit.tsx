import { C, line, thin } from './palette'

// The parts kit: every machine is built from these, so they all look like one fleet.

export function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#2b2f33" {...line} />
      <circle cx={cx} cy={cy} r={r * 0.48} fill={C.steel} {...thin} />
      <circle cx={cx} cy={cy} r={Math.max(1.4, r * 0.14)} fill={C.ink} />
    </g>
  )
}

export function Track({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = h / 2
  const count = Math.max(2, Math.round(w / (h * 1.05)))
  const step = (w - 2 * r) / (count - 1)
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="#33383e" {...line} />
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={x + r + i * step} cy={y + r} r={r * 0.52} fill={C.steel} {...thin} />
      ))}
    </g>
  )
}

/** A cab window with a little shine on it. */
export function Glass({ d }: { d: string }) {
  return <path d={d} fill={C.glass} {...thin} strokeWidth={2.5} />
}

export const Shadow = ({ cx = 50, rx = 42 }: { cx?: number; rx?: number }) => (
  <ellipse cx={cx} cy={92} rx={rx} ry={3.2} fill="rgba(31, 35, 40, 0.18)" />
)

