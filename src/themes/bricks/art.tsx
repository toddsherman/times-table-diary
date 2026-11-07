import type { CSSProperties, ReactNode } from 'react'
import type { StickerId } from '../../stickers'
import { LINE, PALETTE, REWARD_MODELS, REWARD_NAMES } from './models'

/**
 * Brick art. Models (see ./models) are drawn from the side as bricks with studs on every top
 * that shows, and can be drawn part-built: only the bottom layers solid.
 */

/** One stud's width and a layer's height: a brick is a little taller than it is wide. */
const U = 10
const H = 12
const STUD_W = 6
const STUD_H = 3

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
}

/** The same picture in gold: light, middle and dark golds keep the shapes readable. */
function goldOf(hex: string): string {
  const lum = luminance(hex)
  return lum > 180 ? '#ffe58a' : lum > 100 ? '#f5c518' : '#c99a06'
}

/** A row's runs of one color, cut into bricks of up to 4, with joints staggered row to row. */
function bricksOf(row: string, r: number): { c: number; len: number; color: string }[] {
  const out: { c: number; len: number; color: string }[] = []
  let c = 0
  while (c < row.length) {
    const color = row[c]
    let end = c
    while (end < row.length && row[end] === color) end++
    if (color !== '.') {
      let left = end - c
      let at = c
      let first = left > 4 && r % 2 === 1 ? 2 : 0
      while (left > 0) {
        let take = first || Math.min(4, left)
        first = 0
        if (left - take === 1 && take > 2) take -= 1
        out.push({ c: at, len: take, color })
        at += take
        left -= take
      }
    }
    c = end
  }
  return out
}

/** A 4-point twinkle, for finished builds and shiny facts. */
export function Twinkle({ x, y, r, fill = '#fff' }: { x: number; y: number; r: number; fill?: string }) {
  const k = r * 0.28
  return (
    <path
      className="bricks-twinkle"
      d={`M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`}
      fill={fill}
      stroke={LINE}
      strokeWidth={0.9}
      strokeLinejoin="round"
    />
  )
}

interface ModelProps {
  rows: readonly string[]
  /** Layers built, counting from the bottom. The rest are faint outlines. Defaults to all. */
  built?: number
  gold?: boolean
  shine?: boolean
  /** Pads the picture into a square, for rewards and icons. */
  square?: boolean
  className?: string
  size?: number
  label?: string
  /** How many of the top built layers are new since the last look: they drop in once. */
  fresh?: number
  /** Where this model's first new layer falls among everything new on screen, for the stagger. */
  freshFrom?: number
  /** Tapping the model makes it hop and click its top layer back on. */
  tap?: boolean
}

/** Draws a model as bricks. */
export function BrickModel({ rows, built = rows.length, gold = false, shine = false, square = false, className, size, label, fresh = 0, freshFrom = 0, tap = false }: ModelProps) {
  const cols = Math.max(...rows.map((row) => row.length))
  const firstBuilt = rows.length - built
  const w = cols * U
  const h = rows.length * H
  let vb = { x: -1.5, y: -STUD_H - 1.5, w: w + 3, h: h + STUD_H + 3 }
  if (square) {
    const side = Math.max(vb.w, vb.h) + 4
    vb = { x: vb.x - (side - vb.w) / 2, y: vb.y - (side - vb.h) / 2, w: side, h: side }
  }
  const parts: ReactNode[] = []
  rows.forEach((row, r) => {
    const solid = r >= firstBuilt
    const top = r * H
    // Built layers carry their height from the bottom (and whether they're new) for the motion.
    const isNew = solid && r < firstBuilt + fresh
    const layer = solid
      ? {
          className: r === firstBuilt ? 'bricks-layer bricks-top' : 'bricks-layer',
          style: { '--r': rows.length - 1 - r, ...(isNew && { '--fresh-i': freshFrom + firstBuilt + fresh - 1 - r }) } as CSSProperties,
          ...(isNew && { 'data-fresh': '' }),
        }
      : {}
    for (const brick of bricksOf(row, r)) {
      const color = gold ? goldOf(PALETTE[brick.color]) : PALETTE[brick.color]
      const x = brick.c * U
      const bw = brick.len * U
      parts.push(
        solid ? (
          <g key={`b${r}-${brick.c}`} {...layer}>
            <rect x={x} y={top} width={bw} height={H} rx={1.2} fill={color} stroke={LINE} strokeWidth={1} />
            <rect x={x + 1.3} y={top + 1.3} width={bw - 2.6} height={2.2} rx={1} fill="#fff" opacity={0.35} />
            <rect x={x + 1} y={top + H - 2.8} width={bw - 2} height={1.8} rx={0.8} fill="#000" opacity={0.16} />
          </g>
        ) : (
          <rect
            key={`b${r}-${brick.c}`}
            x={x}
            y={top}
            width={bw}
            height={H}
            rx={1.2}
            fill="#fff"
            fillOpacity={0.5}
            stroke="#8f9aab"
            strokeWidth={0.8}
            strokeDasharray="2.4 1.6"
          />
        ),
      )
      // A stud on every cell whose top shows: nothing above it, or the layer above isn't built yet.
      for (let c = brick.c; c < brick.c + brick.len; c++) {
        const above = r === 0 ? '.' : (rows[r - 1][c] ?? '.')
        if (above !== '.' && (!solid || r - 1 >= firstBuilt)) continue
        const sx = c * U + (U - STUD_W) / 2
        const d = `M${sx} ${top + 0.7}V${top - STUD_H + 1}Q${sx} ${top - STUD_H} ${sx + 1} ${top - STUD_H}H${sx + STUD_W - 1}Q${sx + STUD_W} ${top - STUD_H} ${sx + STUD_W} ${top - STUD_H + 1}V${top + 0.7}`
        parts.push(
          solid ? (
            <path key={`s${r}-${c}`} {...layer} d={d} fill={color} stroke={LINE} strokeWidth={1} strokeLinejoin="round" />
          ) : (
            <path key={`s${r}-${c}`} d={d} fill="#fff" fillOpacity={0.5} stroke="#8f9aab" strokeWidth={0.8} strokeDasharray="2.4 1.6" />
          ),
        )
      }
    }
  })
  if (shine) {
    parts.push(<Twinkle key="t1" x={w - 4} y={2} r={7} fill={gold ? '#fff7cc' : '#fff'} />)
    parts.push(<Twinkle key="t2" x={4} y={h * 0.45} r={4.5} fill={gold ? '#fff7cc' : '#fff'} />)
  }
  return (
    <svg
      className={className}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-tap={tap ? '' : undefined}
    >
      {parts}
    </svg>
  )
}

/** A classic 2×4 brick at an angle, with its eight studs. */
export function TiltedBrick({ color = '#d9262c', size = 56, label, className = '' }: { color?: string; size?: number; label?: string; className?: string }) {
  const s = 13
  const ex = [0.866 * s, 0.5 * s]
  const ey = [-0.866 * s, 0.5 * s]
  const tall = 1.25 * s
  const ox = 38.75
  const oy = 26
  const at = (x: number, y: number): [number, number] => [ox + x * ex[0] + y * ey[0], oy + x * ex[1] + y * ey[1]]
  const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const [a, b, c, d] = [at(0, 0), at(4, 0), at(4, 2), at(0, 2)]
  const down = (p: [number, number]): [number, number] => [p[0], p[1] + tall]
  const shade = (hex: string, k: number) => {
    const n = parseInt(hex.slice(1), 16)
    const ch = (v: number) => Math.round(v * k)
    return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`
  }
  const rx = 1.2247 * s * 0.3
  const ry = 0.7071 * s * 0.3
  const sh = 0.24 * s
  const studs: [number, number][] = []
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) studs.push(at(i + 0.5, j + 0.5))
  studs.sort((p, q) => p[1] - q[1])
  const stroke = { stroke: LINE, strokeWidth: 1.6, strokeLinejoin: 'round' } as const
  return (
    <svg className={`sticker bricks-tilted ${className}`} viewBox="0 0 100 100" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <polygon points={pts([d, c, down(c), down(d)])} fill={shade(color, 0.78)} {...stroke} />
      <polygon points={pts([c, b, down(b), down(c)])} fill={shade(color, 0.62)} {...stroke} />
      <polygon points={pts([a, b, c, d])} fill={color} {...stroke} />
      {studs.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <path d={`M${x - rx} ${y}V${y - sh}A${rx} ${ry} 0 0 1 ${x + rx} ${y - sh}V${y}A${rx} ${ry} 0 0 1 ${x - rx} ${y}Z`} fill={shade(color, 0.8)} {...stroke} strokeWidth={1.2} />
          <ellipse cx={x} cy={y - sh} rx={rx} ry={ry} fill={color} {...stroke} strokeWidth={1.2} />
          <ellipse cx={x - rx * 0.25} cy={y - sh - ry * 0.2} rx={rx * 0.42} ry={ry * 0.35} fill="#fff" opacity={0.45} />
        </g>
      ))}
    </svg>
  )
}

export function Reward({ id, size, className = '' }: { id: StickerId; size: number; className?: string }) {
  if (id === 'star') return <TiltedBrick size={size} label={REWARD_NAMES.star} className={className} />
  const rows = REWARD_MODELS[id]
  if (!rows) return null
  return <BrickModel rows={rows} square size={size} className={`sticker bricks-piece ${className}`} label={REWARD_NAMES[id]} />
}

export function Cover() {
  return (
    <>
      <TiltedBrick color="#1e6fd9" size={60} />
      <TiltedBrick color="#d9262c" size={72} />
      <TiltedBrick color="#f7c82b" size={60} />
    </>
  )
}

export function FastIcon() {
  return (
    <svg viewBox="0 0 30 30" width={30} height={30} aria-hidden="true">
      <polygon points="18,2 6,17 13,17 10,28 24,11 16,11 20,2" fill="#f7c82b" stroke={LINE} strokeWidth={2} strokeLinejoin="round" />
      <path d="M17 5 11 14" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
    </svg>
  )
}

/** The shine on shiny and gold facts. */
export function Mark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <Twinkle x={10} y={10} r={9} fill="#fff" />
    </svg>
  )
}

/** A big 2×4 brick behind the cheer. Its color comes from the stylesheet. */
export function BurstShape() {
  return (
    <svg viewBox="0 0 200 200" className="burst-shape" aria-hidden="true">
      <rect x="4" y="56" width="192" height="100" rx="10" />
      {[26, 70, 114, 158].map((x) => (
        <path key={x} d={`M${x - 16} 57.5V42Q${x - 16} 36 ${x - 10} 36H${x + 10}Q${x + 16} 36 ${x + 16} 42V57.5`} />
      ))}
      <rect x="14" y="64" width="172" height="10" rx="5" fill="#fff" opacity="0.4" stroke="none" />
      <rect x="12" y="138" width="176" height="9" rx="4.5" fill="#000" opacity="0.12" stroke="none" />
    </svg>
  )
}
