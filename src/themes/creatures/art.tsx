import { useId, type ReactNode } from 'react'
import { f, OUT, sparklePath, starPoints } from './geometry'
import { LINES, creatureName, type CreatureLine, type Palette } from './lines'

const SW = 2.6

type Stage = 1 | 2 | 3

/** Where the body sits for each stage: babies are small and low, final forms fill the frame. */
interface Geo {
  stage: Stage
  cx: number
  cy: number
  rx: number
  ry: number
  /** Top and bottom of the body. */
  top: number
  bottom: number
  /** Face center height. */
  fy: number
  /** Eye spacing and size. */
  ex: number
  er: number
  /** Feature scale, 1 for the middle stage. */
  k: number
}

function geo(stage: Stage, shape: Shape): Geo {
  const base = { 1: { cy: 67, rx: 20, ry: 18, k: 0.85 }, 2: { cy: 63, rx: 25, ry: 23, k: 1 }, 3: { cy: 59, rx: 29, ry: 27, k: 1.15 } }[stage]
  const { cy, rx, ry, k } = base
  const tall = shape === 'tall'
  const r = tall ? { rx: rx * 0.9, ry: ry * 1.08 } : { rx, ry }
  const fy = shape === 'drop' ? cy - r.ry * 0.02 : cy - r.ry * 0.14
  return {
    stage,
    cx: 50,
    cy,
    rx: r.rx,
    ry: r.ry,
    top: cy - r.ry,
    bottom: cy + r.ry,
    fy,
    ex: r.rx * 0.4,
    er: { 1: 4.5, 2: 4.1, 3: 3.7 }[stage],
    k,
  }
}


const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`

type Shape = 'round' | 'tall' | 'pear' | 'drop' | 'cloud'

/** The body outline, as one or more paths (several are drawn as one shape). */
function bodyPaths(g: Geo, shape: Shape): string[] {
  const { cx, cy, rx, ry } = g
  switch (shape) {
    case 'pear':
      return [
        `M${cx} ${f(cy - ry)}C${f(cx + rx * 0.72)} ${f(cy - ry)} ${f(cx + rx * 1.02)} ${f(cy + ry * 0.05)} ${f(cx + rx * 1.02)} ${f(cy + ry * 0.45)}` +
          `C${f(cx + rx * 1.02)} ${f(cy + ry * 0.9)} ${f(cx + rx * 0.6)} ${f(cy + ry)} ${cx} ${f(cy + ry)}` +
          `C${f(cx - rx * 0.6)} ${f(cy + ry)} ${f(cx - rx * 1.02)} ${f(cy + ry * 0.9)} ${f(cx - rx * 1.02)} ${f(cy + ry * 0.45)}` +
          `C${f(cx - rx * 1.02)} ${f(cy + ry * 0.05)} ${f(cx - rx * 0.72)} ${f(cy - ry)} ${cx} ${f(cy - ry)}Z`,
      ]
    case 'drop':
      return [
        `M${cx} ${f(cy - ry * 1.28)}C${f(cx + rx * 0.3)} ${f(cy - ry * 0.98)} ${f(cx + rx)} ${f(cy - ry * 0.4)} ${f(cx + rx)} ${f(cy + ry * 0.2)}` +
          `C${f(cx + rx)} ${f(cy + ry * 0.75)} ${f(cx + rx * 0.55)} ${f(cy + ry)} ${cx} ${f(cy + ry)}` +
          `C${f(cx - rx * 0.55)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ry * 0.75)} ${f(cx - rx)} ${f(cy + ry * 0.2)}` +
          `C${f(cx - rx)} ${f(cy - ry * 0.4)} ${f(cx - rx * 0.3)} ${f(cy - ry * 0.98)} ${cx} ${f(cy - ry * 1.28)}Z`,
      ]
    case 'cloud': {
      const bumps = [-165, -125, -90, -55, -15, 25, 60, 120, 155].map((deg) => {
        const a = (deg * Math.PI) / 180
        const r = (deg > 0 && deg < 180 ? 0.3 : 0.38) * rx
        return ellipse(cx + Math.cos(a) * rx * 0.78, cy + Math.sin(a) * ry * 0.78, r, r)
      })
      return [ellipse(cx, cy, rx * 0.92, ry * 0.92), ...bumps]
    }
    default:
      return [ellipse(cx, cy, g.rx, g.ry)]
  }
}

/** Several outlined paths drawn as one shape: outlines first, then all the fills on top. */
function Union({ paths, fill, sw = SW }: { paths: string[]; fill: string; sw?: number }) {
  return (
    <g strokeLinejoin="round">
      <g fill={OUT} stroke={OUT} strokeWidth={sw * 2}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill={fill}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </g>
  )
}

const ink = { stroke: OUT, strokeWidth: SW, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** A leaf pointing along `angle` (0 = up) from its stem at (x, y). */
function leafPath(len: number, w: number) {
  return `M0 0C${f(w / 2)} ${f(-len * 0.25)} ${f(w / 2)} ${f(-len * 0.7)} 0 ${f(-len)}C${f(-w / 2)} ${f(-len * 0.7)} ${f(-w / 2)} ${f(-len * 0.25)} 0 0Z`
}

function Leaf({ x, y, len, w, angle, fill, vein = true }: { x: number; y: number; len: number; w: number; angle: number; fill: string; vein?: boolean }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${angle})`}>
      <path d={leafPath(len, w)} fill={fill} {...ink} />
      {vein && <path d={`M0 ${f(-len * 0.12)}L0 ${f(-len * 0.8)}`} stroke={OUT} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />}
    </g>
  )
}

/** A flame tongue, base at (x, y), pointing along `angle`. */
function Flame({ x, y, h, w, angle = 0, outer, inner }: { x: number; y: number; h: number; w: number; angle?: number; outer: string; inner: string }) {
  const d = (s: number) =>
    `M${f(-w * 0.5 * s)} 0C${f(-w * 0.62 * s)} ${f(-h * 0.35 * s)} ${f(-w * 0.2 * s)} ${f(-h * 0.55 * s)} ${f(-w * 0.12 * s)} ${f(-h * 0.72 * s)}` +
    `C${f(-w * 0.02 * s)} ${f(-h * 0.85 * s)} ${f(w * 0.05 * s)} ${f(-h * 0.92 * s)} 0 ${f(-h * s)}` +
    `C${f(w * 0.3 * s)} ${f(-h * 0.8 * s)} ${f(w * 0.62 * s)} ${f(-h * 0.5 * s)} ${f(w * 0.5 * s)} 0Z`
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${angle})`}>
      <path d={d(1)} fill={outer} {...ink} />
      <path d={d(0.55)} fill={inner} transform={`translate(0 ${f(-h * 0.06)})`} />
    </g>
  )
}

/** Point on the body's outline ellipse at `deg` (0 = right, -90 = top), pushed out by `out`. */
function rim(g: Geo, deg: number, out = 0) {
  const a = (deg * Math.PI) / 180
  return { x: g.cx + Math.cos(a) * (g.rx + out), y: g.cy + Math.sin(a) * (g.ry + out) }
}

interface Parts {
  back?: ReactNode
  front?: ReactNode
  over?: ReactNode
  mouth?: 'smile' | 'cat' | 'open' | 'fang' | 'none'
  feet?: boolean
  belly?: boolean
  /** A light patch behind the eyes, for dark bodies. */
  facePatch?: string
  /** Owl-like discs behind the eyes. */
  eyeDiscs?: string
  blush?: string | null
  freckles?: string
}

type Features = (g: Geo, c: Palette) => Parts

const FEATURES: Record<CreatureLine['element'], Features> = {
  rock(g, c) {
    const stones = { 1: [-118, -62], 2: [-140, -100, -60], 3: [-155, -125, -55, -25] }[g.stage]
    const size = { 1: 7.5, 2: 9, 3: 10 }[g.stage]
    return {
      back: (
        <>
          {stones.map((deg, i) => {
            const p = rim(g, deg, 1)
            const s = size * (i % 2 ? 0.85 : 1.05)
            const pts = [0, 70, 140, 215, 290].map((a, j) => {
              const r = s * (j % 2 ? 0.85 : 1.1)
              const rad = ((a + deg) * Math.PI) / 180
              return `${f(p.x + Math.cos(rad) * r)},${f(p.y + Math.sin(rad) * r)}`
            })
            return <polygon key={deg} points={pts.join(' ')} fill={i % 2 ? c.accent2 : c.accent} {...ink} />
          })}
          {g.stage === 3 && (
            <polygon
              points={`${g.cx - 9},${f(g.top + 5)} ${g.cx - 4},${f(g.top - 13)} ${g.cx + 2},${f(g.top - 7)} ${g.cx + 6},${f(g.top - 17)} ${g.cx + 10},${f(g.top + 5)}`}
              fill={c.accent}
              {...ink}
            />
          )}
          {[-1, 1].map((side) => (
            <ellipse
              key={side}
              cx={g.cx + side * g.rx * 0.82}
              cy={g.top + g.ry * 0.42}
              rx={5 * g.k}
              ry={7.5 * g.k}
              transform={`rotate(${side * 35} ${g.cx + side * g.rx * 0.82} ${g.top + g.ry * 0.42})`}
              fill={c.dark}
              {...ink}
            />
          ))}
        </>
      ),
      front: (
        <>
          {g.stage >= 2 && (
            <path
              d={`M${f(g.cx - g.rx * 0.78)} ${f(g.cy + 2)}l4 3l-1 4M${f(g.cx + g.rx * 0.72)} ${f(g.cy - 4)}l-3 4l2 3`}
              fill="none"
              stroke={c.dark}
              strokeWidth={2}
              strokeLinecap="round"
            />
          )}
        </>
      ),
      mouth: 'smile',
    }
  },

  leaf(g, c) {
    const len = { 1: 17, 2: 23, 3: 27 }[g.stage]
    const spread = { 1: 16, 2: 22, 3: 26 }[g.stage]
    return {
      back: (
        <>
          <Leaf x={g.cx + g.rx * 0.85} y={g.cy + g.ry * 0.4} len={10 + 4 * g.stage} w={8 + 2 * g.stage} angle={62} fill={c.accent} />
          {g.stage === 3 && <Leaf x={g.cx - g.rx * 0.85} y={g.cy + g.ry * 0.4} len={14} w={10} angle={-62} fill={c.accent} />}
          {[-1, 1].map((side) => (
            <Leaf key={side} x={g.cx + side * g.rx * 0.32} y={g.top + 4} len={len} w={len * 0.48} angle={side * spread} fill={c.main} />
          ))}
        </>
      ),
      front:
        g.stage >= 2 ? (
          <g>
            <path d={`M${g.cx} ${f(g.top + 3)}c0 -6 4 -8 6 -6c2 2 -1 5 -3 3`} fill="none" stroke={OUT} strokeWidth={4.4} strokeLinecap="round" />
            <path d={`M${g.cx} ${f(g.top + 3)}c0 -6 4 -8 6 -6c2 2 -1 5 -3 3`} fill="none" stroke={c.accent} strokeWidth={2} strokeLinecap="round" />
            <Leaf x={g.cx} y={g.top + 1} len={9} w={6} angle={-40} fill={c.accent} vein={false} />
          </g>
        ) : null,
      over:
        g.stage === 3 ? (
          <g>
            {[0, 72, 144, 216, 288].map((a) => {
              const rad = (a * Math.PI) / 180
              return <circle key={a} cx={f(g.cx + g.rx * 0.32 + 7 + Math.cos(rad) * 3.4)} cy={f(g.top + 1 + Math.sin(rad) * 3.4)} r={2.6} fill="#fff" {...ink} strokeWidth={1.4} />
            })}
            <circle cx={g.cx + g.rx * 0.32 + 7} cy={g.top + 1} r={2.3} fill={c.accent2} {...ink} strokeWidth={1.4} />
          </g>
        ) : null,
      mouth: 'cat',
    }
  },

  water(g, c) {
    const fin = (side: number) => {
      const x = g.cx + side * g.rx * 0.9
      const y = g.cy - g.ry * 0.15
      const s = g.k
      return (
        <g key={side}>
          {[-30, 0, 30].map((a) => (
            <ellipse
              key={a}
              cx={f(x + side * 6 * s)}
              cy={f(y)}
              rx={6.5 * s}
              ry={3.4 * s}
              transform={`rotate(${side * a} ${f(x)} ${f(y)})`}
              fill={c.accent}
              {...ink}
              strokeWidth={2}
            />
          ))}
        </g>
      )
    }
    return {
      back: (
        <>
          {g.stage >= 2 && (
            <path
              d={`M${f(g.cx + g.rx * 0.6)} ${f(g.bottom - 6)}q10 -2 14 -12q-1 9 4 13q-6 -1 -10 6q-2 -5 -8 -7Z`}
              fill={c.dark}
              {...ink}
            />
          )}
          {g.stage === 3 && (
            <path
              d={`M${f(g.cx - 4)} ${f(g.top - 4)}c4 -14 22 -16 26 -4c-6 -6 -14 -2 -12 5c-5 0 -10 1 -14 -1Z`}
              fill={c.accent}
              {...ink}
            />
          )}
          {fin(-1)}
          {fin(1)}
        </>
      ),
      front: (
        <>
          <ellipse cx={g.cx - g.rx * 0.45} cy={g.cy - g.ry * 0.62} rx={2.6} ry={4} transform={`rotate(25 ${g.cx - g.rx * 0.45} ${g.cy - g.ry * 0.62})`} fill="#fff" opacity={0.7} />
        </>
      ),
      over: (
        <>
          {[
            [g.cx - g.rx - 6, g.cy - g.ry * 0.85, 3],
            [g.cx - g.rx - 1, g.cy - g.ry * 1.2, 2],
            ...(g.stage >= 2 ? [[g.cx + g.rx + 5, g.cy - g.ry * 0.9, 2.6]] : []),
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={f(x)} cy={f(y)} r={r} fill={c.light} stroke={OUT} strokeWidth={1.4} />
          ))}
        </>
      ),
      mouth: 'open',
      feet: false,
    }
  },

  fire(g, c) {
    const ears =
      g.stage >= 2 &&
      [-1, 1].map((side) => {
        const x = g.cx + side * g.rx * 0.62
        const y = g.top + g.ry * 0.3
        return (
          <polygon
            key={side}
            points={`${f(x - 6 * g.k)},${f(y + 4)} ${f(x + side * 4)},${f(y - 13 * g.k)} ${f(x + 7 * g.k)},${f(y + 4)}`}
            fill={c.dark}
            {...ink}
          />
        )
      })
    const flames =
      g.stage === 1
        ? [{ deg: -90, h: 15, w: 12 }]
        : g.stage === 2
          ? [
              { deg: -112, h: 12, w: 10 },
              { deg: -68, h: 12, w: 10 },
              { deg: -90, h: 18, w: 13 },
            ]
          : [-170, -150, -128, -106, -74, -52, -30, -10, -90].map((deg) => ({ deg, h: deg === -90 ? 22 : 16, w: 12 }))
    return {
      back: (
        <>
          {ears}
          {flames.map(({ deg, h, w }) => {
            const p = rim(g, deg, -4)
            return <Flame key={deg} x={p.x} y={p.y} h={h} w={w} angle={deg + 90} outer={c.accent2} inner={c.accent} />
          })}
        </>
      ),
      front: g.stage >= 2 ? <ellipse cx={g.cx} cy={g.fy + 8} rx={g.rx * 0.36} ry={g.ry * 0.2} fill={c.light} /> : null,
      mouth: g.stage === 3 ? 'fang' : g.stage === 2 ? 'cat' : 'smile',
    }
  },

  spark(g, c) {
    const tufts = [-1, 1].map((side) => {
      const x = g.cx + side * g.rx * 0.42
      const y = g.top + 5
      const h = 10 + 4 * g.stage
      const pts = [
        [x - side * 5, y + 2],
        [x + side * 2, y - h],
        [x + side * 4, y - h * 0.55],
        [x + side * 9, y - h * 0.8],
        [x + side * 9, y + 4],
      ]
      return <polygon key={side} points={pts.map(([px, py]) => `${f(px)},${f(py)}`).join(' ')} fill={c.dark} {...ink} />
    })
    const wings = [-1, 1].map((side) => {
      const x = g.cx + side * g.rx * 0.88
      const y = g.cy + g.ry * 0.05
      if (g.stage === 1) return <ellipse key={side} cx={x + side * 2} cy={y} rx={5} ry={8} transform={`rotate(${side * -20} ${x} ${y})`} fill={c.dark} {...ink} />
      const span = g.stage === 2 ? 14 : 24
      const pts = [
        [x, y - 10],
        [x + side * span, y - 16],
        [x + side * (span - 4), y - 6],
        [x + side * span, y - 2],
        [x + side * (span - 5), y + 5],
        [x + side * (span - 3), y + 10],
        [x, y + 10],
      ]
      return (
        <g key={side}>
          <polygon points={pts.map(([px, py]) => `${f(px)},${f(py)}`).join(' ')} fill={c.dark} {...ink} />
          <path d={`M${f(x + side * 3)} ${f(y - 6)}l${side * span * 0.45} -4l${side * -4} 5l${side * span * 0.4} -2`} fill="none" stroke={c.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    })
    const by = g.cy + g.ry * 0.45
    const b = g.k * 1.1
    const bolt = [
      [2, -9],
      [-5, 1],
      [0, 1],
      [-2, 9],
      [5, -2],
      [0, -2],
      [3, -9],
    ]
      .map(([x, y]) => `${f(g.cx + x * b)},${f(by + y * b)}`)
      .join(' ')
    return {
      back: (
        <>
          {wings}
          {tufts}
        </>
      ),
      front: <polygon points={bolt} fill={c.accent} {...ink} strokeWidth={1.8} />,
      over: <path d={`M${g.cx - 3} ${f(g.fy + 4)}L${g.cx + 3} ${f(g.fy + 4)}L${g.cx} ${f(g.fy + 9)}Z`} fill={c.accent} {...ink} strokeWidth={1.6} />,
      eyeDiscs: c.light,
      mouth: 'none',
    }
  },

  ice(g, c) {
    const earH = 12 + 4 * g.stage
    const ears = [-1, 1].map((side) => {
      const x = g.cx + side * g.rx * 0.5
      const y = g.top + 6
      return (
        <g key={side}>
          <polygon points={`${f(x - 7)},${f(y + 4)} ${f(x + side * 3)},${f(y - earH)} ${f(x + 8)},${f(y + 4)}`} fill={c.main} {...ink} />
          <path d={`M${f(x + side * 3)} ${f(y - earH)}l${side * 2} -6`} stroke={OUT} strokeWidth={2.4} strokeLinecap="round" />
          <polygon points={`${f(x - 3)},${f(y + 2)} ${f(x + side * 2.4)},${f(y - earH * 0.62)} ${f(x + 4)},${f(y + 2)}`} fill={c.dark} opacity={0.55} />
        </g>
      )
    })
    const tail =
      g.stage >= 2 ? (
        <g>
          <path
            d={`M${f(g.cx + g.rx * 0.7)} ${f(g.cy + g.ry * 0.55)}c12 2 18 -8 16 -20c6 8 6 22 -6 28c-4 2 -8 2 -12 0Z`}
            fill={c.main}
            {...ink}
          />
          {g.stage === 3 && (
            <path
              d={`M${f(g.cx + g.rx * 0.7 + 14)} ${f(g.cy + g.ry * 0.55 - 6)}c2 -4 2 -8 1 -11M${f(g.cx + g.rx * 0.7 + 9)} ${f(g.cy + g.ry * 0.55 + 1)}c3 -3 5 -7 5 -11`}
              fill="none"
              stroke={c.accent2}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          )}
        </g>
      ) : null
    const horn =
      g.stage === 1 ? (
        <path d={`M${g.cx} ${f(g.top + 4)}l0 7M${g.cx - 3} ${f(g.top + 5.5)}l6 4M${g.cx + 3} ${f(g.top + 5.5)}l-6 4`} stroke={c.dark} strokeWidth={1.8} strokeLinecap="round" />
      ) : (
        <polygon
          points={`${g.cx - 4},${f(g.top + 3)} ${g.cx},${f(g.top - (g.stage === 3 ? 16 : 10))} ${g.cx + 4},${f(g.top + 3)}`}
          fill={c.accent}
          {...ink}
        />
      )
    const crown =
      g.stage === 3
        ? [-1, 1].map((side) => (
            <polygon
              key={side}
              points={`${f(g.cx + side * 6 - 3)},${f(g.top + 4)} ${f(g.cx + side * 8)},${f(g.top - 8)} ${f(g.cx + side * 10 + 1)},${f(g.top + 5)}`}
              fill={c.accent}
              {...ink}
              strokeWidth={2}
            />
          ))
        : null
    const flake = (() => {
      const x = g.cx
      const y = g.cy + g.ry * 0.45
      const r = 5 * g.k
      return [0, 60, 120].map((a) => {
        const rad = (a * Math.PI) / 180
        return (
          <path
            key={a}
            d={`M${f(x - Math.cos(rad) * r)} ${f(y - Math.sin(rad) * r)}L${f(x + Math.cos(rad) * r)} ${f(y + Math.sin(rad) * r)}`}
            stroke={c.dark}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })
    })()
    return {
      back: (
        <>
          {tail}
          {ears}
          {crown}
          {g.stage >= 2 && horn}
        </>
      ),
      front: (
        <>
          {g.stage === 1 && horn}
          {g.stage >= 2 && flake}
        </>
      ),
      mouth: 'cat',
    }
  },

  wind(g, c) {
    const wing = (side: number) => {
      const big = g.stage === 3
      const x = g.cx + side * g.rx * (big ? 0.75 : 0.62)
      const y = big ? g.cy - g.ry * 0.25 : g.top + 7
      const s = { 1: 0.95, 2: 1.15, 3: 1.45 }[g.stage]
      const feathers = [0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={f(x + side * (6 + i * 5) * s)}
          cy={f(y - (8 - i * 4) * s)}
          rx={7 * s}
          ry={3.6 * s}
          transform={`rotate(${side * (-35 + i * 25)} ${f(x + side * (6 + i * 5) * s)} ${f(y - (8 - i * 4) * s)})`}
          fill={i === 1 ? c.accent2 : c.main}
          {...ink}
          strokeWidth={2}
        />
      ))
      return <g key={side}>{feathers}</g>
    }
    return {
      back: (
        <>
          <path
            d={`M${f(g.cx + g.rx * 0.7)} ${f(g.cy + g.ry * 0.5)}c10 4 16 -4 12 -10c-3 -4 -9 -2 -7 2`}
            fill="none"
            stroke={OUT}
            strokeWidth={5.5}
            strokeLinecap="round"
          />
          <path
            d={`M${f(g.cx + g.rx * 0.7)} ${f(g.cy + g.ry * 0.5)}c10 4 16 -4 12 -10c-3 -4 -9 -2 -7 2`}
            fill="none"
            stroke={c.accent}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          {wing(-1)}
          {wing(1)}
        </>
      ),
      front: (
        <path
          d={`M${g.cx} ${f(g.fy - 9 * g.k)}c3 0 3 -4 0 -4c-4 0 -5 6 0 7c6 0 7 -8 1 -10`}
          fill="none"
          stroke={c.accent}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ),
      mouth: 'smile',
      feet: false,
      belly: false,
    }
  },

  bloom(g, c) {
    const top = g.top + 2
    const flower = (cx: number, cy: number, r: number, petals: number, fill: string) => (
      <g>
        {Array.from({ length: petals }, (_, i) => {
          const a = (i * 360) / petals
          return (
            <ellipse
              key={i}
              cx={cx}
              cy={f(cy - r)}
              rx={r * 0.55}
              ry={r}
              transform={`rotate(${f(a)} ${cx} ${cy})`}
              fill={fill}
              {...ink}
              strokeWidth={2}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={r * 0.6} fill="#ffd84d" {...ink} strokeWidth={2} />
      </g>
    )
    return {
      back: (
        <>
          {g.stage === 3 &&
            [20, 50, 130, 160].map((deg) => {
              const p = rim(g, deg, -3)
              return <ellipse key={deg} cx={f(p.x)} cy={f(p.y)} rx={6} ry={11} transform={`rotate(${deg - 90} ${f(p.x)} ${f(p.y)})`} fill={c.accent2} {...ink} strokeWidth={2} />
            })}
          {g.stage >= 2 &&
            [-1, 1].map((side) => (
              <Leaf key={`arm${side}`} x={g.cx + side * g.rx * 0.9} y={g.cy + g.ry * 0.3} len={12 * g.k} w={8 * g.k} angle={side * 105} fill="#7ccf5a" />
            ))}
          {g.stage === 1 && (
            <g>
              <path d={`M${g.cx} ${f(top + 2)}l0 -7`} stroke="#4c9e3d" strokeWidth={2.6} strokeLinecap="round" />
              <Leaf x={g.cx} y={top - 3} len={8} w={6} angle={55} fill="#7ccf5a" vein={false} />
              <path d={`M${g.cx} ${f(top - 17)}c5 3 6 9 0 12c-6 -3 -5 -9 0 -12Z`} fill={c.accent2} {...ink} />
            </g>
          )}
          {g.stage === 2 && (
            <>
              {[-1, 1].map((side) => (
                <ellipse key={side} cx={g.cx + side * g.rx * 0.6} cy={top + 4} rx={6} ry={9} transform={`rotate(${side * 30} ${g.cx + side * g.rx * 0.6} ${top + 4})`} fill={c.accent2} {...ink} />
              ))}
              {flower(g.cx, top - 6, 6.5, 5, c.accent)}
            </>
          )}
          {g.stage === 3 && (
            <>
              {[-1, 1].map((side) => (
                <Leaf key={side} x={g.cx + side * 8} y={top + 2} len={16} w={9} angle={side * 60} fill="#7ccf5a" />
              ))}
              {flower(g.cx, top - 9, 9, 7, c.accent2)}
              {flower(g.cx, top - 9, 6, 6, c.accent)}
            </>
          )}
        </>
      ),
      mouth: 'smile',
      blush: '#ff5b97',
    }
  },

  crystal(g, c) {
    const spikes = { 1: [-130, -90, -50], 2: [-150, -120, -90, -60, -30], 3: [-160, -135, -112, -90, -68, -45, -20] }[g.stage]
    const crystal = (deg: number, i: number) => {
      const p = rim(g, deg, -3)
      const h = (deg === -90 ? 15 : 10) * g.k + (i % 2) * 2
      const w = 4.2 * g.k
      return (
        <g key={deg} transform={`translate(${f(p.x)} ${f(p.y)}) rotate(${deg + 90})`}>
          <polygon points={`${f(-w)},2 ${f(-w)},${f(-h * 0.7)} 0,${f(-h)} ${f(w)},${f(-h * 0.7)} ${f(w)},2`} fill={c.accent} {...ink} />
          <path d={`M0 ${f(-h)}L0 0`} stroke="#8fe3ef" strokeWidth={1.6} />
        </g>
      )
    }
    return {
      back: <>{spikes.map(crystal)}</>,
      front: (
        <>
          {g.stage >= 2 &&
            [0.25, 0.55].map((t) => (
              <path
                key={t}
                d={`M${f(g.cx - g.rx * 0.85)} ${f(g.cy + g.ry * t)}Q${g.cx} ${f(g.cy + g.ry * (t + 0.22))} ${f(g.cx + g.rx * 0.85)} ${f(g.cy + g.ry * t)}`}
                fill="none"
                stroke={c.dark}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            ))}
        </>
      ),
      over: (
        <g>
          <polygon
            points={`${g.cx},${f(g.fy - 13 * g.k)} ${f(g.cx + 4 * g.k)},${f(g.fy - 8 * g.k)} ${g.cx},${f(g.fy - 3.5 * g.k)} ${f(g.cx - 4 * g.k)},${f(g.fy - 8 * g.k)}`}
            fill={c.accent2}
            {...ink}
            strokeWidth={2}
          />
          <path d={`M${f(g.cx - 1.5 * g.k)} ${f(g.fy - 10 * g.k)}l1.5 -1`} stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
        </g>
      ),
      mouth: 'smile',
      belly: g.stage === 1,
    }
  },

  light(g, c) {
    const rays = { 1: 7, 2: 11, 3: 16 }[g.stage]
    const from = g.stage === 3 ? -180 : g.stage === 2 ? -195 : -170
    const to = g.stage === 3 ? 180 : g.stage === 2 ? 15 : -10
    const len = 5 + 2.5 * g.stage
    return {
      back: (
        <>
          {g.stage === 3 && <circle cx={g.cx} cy={g.cy} r={g.rx + 13} fill="#fff3b0" opacity={0.6} />}
          {Array.from({ length: rays }, (_, i) => {
            const deg = from + ((to - from) * (i + (g.stage === 3 ? 0 : 0.5))) / (g.stage === 3 ? rays : rays)
            const base = rim(g, deg, -2)
            const a = (deg * Math.PI) / 180
            const tip = { x: base.x + Math.cos(a) * len, y: base.y + Math.sin(a) * len }
            const n = { x: -Math.sin(a) * 3.6, y: Math.cos(a) * 3.6 }
            return (
              <polygon
                key={i}
                points={`${f(base.x + n.x)},${f(base.y + n.y)} ${f(tip.x)},${f(tip.y)} ${f(base.x - n.x)},${f(base.y - n.y)}`}
                fill={i % 2 ? c.accent2 : c.accent}
                {...ink}
                strokeWidth={2}
              />
            )
          })}
        </>
      ),
      front: <polygon points={starPoints(g.cx, g.fy - 10 * g.k, 3.6 * g.k)} fill={c.accent} {...ink} strokeWidth={1.4} />,
      mouth: 'open',
      blush: null,
      freckles: c.accent2,
    }
  },

  shadow(g, c) {
    const ears = [-1, 1].map((side) => {
      const x = g.cx + side * g.rx * 0.52
      const y = g.top + 6
      const h = 9 + 3 * g.stage
      return (
        <g key={side}>
          <polygon points={`${f(x - 7)},${f(y + 4)} ${f(x + side * 2)},${f(y - h)} ${f(x + 7)},${f(y + 4)}`} fill={c.main} {...ink} />
          <polygon points={`${f(x - 3.4)},${f(y + 2)} ${f(x + side * 1.4)},${f(y - h * 0.6)} ${f(x + 3.4)},${f(y + 2)}`} fill={c.accent2} />
        </g>
      )
    })
    const tailLen = { 1: 10, 2: 16, 3: 20 }[g.stage]
    const tx = g.cx + g.rx * 0.75
    const ty = g.cy + g.ry * 0.45
    const tail = (
      <path
        d={`M${f(tx)} ${f(ty)}c${tailLen * 0.6} 2 ${tailLen} -6 ${tailLen * 0.8} -${tailLen}c4 5 6 3 6 0c3 10 -4 ${tailLen + 4} -${tailLen * 0.4} ${tailLen * 1.05}c-4 0 -8 -1 -12 -3Z`}
        fill={c.main}
        {...ink}
      />
    )
    const cape =
      g.stage === 3
        ? [-1, 1].map((side) => {
            const x = g.cx + side * g.rx * 0.7
            const y = g.cy - g.ry * 0.35
            const s = side
            return (
              <g key={side}>
                <path
                  d={`M${f(x)} ${f(y)}l${s * 18} -8q${s * 2} 12 ${s * -2} 22q${s * -4} -3 ${s * -6} 1q${s * -3} -4 ${s * -7} 0q${s * -2} -3 ${s * -5} 0Z`}
                  fill={c.dark}
                  {...ink}
                />
                {[0, 1].map((i) => (
                  <path key={i} d={sparklePath(x + s * (8 + i * 6), y - 1 + i * 6, 1.8)} fill={c.accent} />
                ))}
              </g>
            )
          })
        : null
    return {
      back: (
        <>
          {cape}
          {tail}
          {ears}
        </>
      ),
      front: (
        <path
          d={`M${f(g.cx + 1)} ${f(g.fy - 15 * g.k)}a${f(4.4 * g.k)} ${f(4.4 * g.k)} 0 1 0 ${f(3 * g.k)} ${f(7.5 * g.k)}a${f(3.4 * g.k)} ${f(3.4 * g.k)} 0 1 1 ${f(-3 * g.k)} ${f(-7.5 * g.k)}Z`}
          fill={c.accent}
          {...ink}
          strokeWidth={1.4}
        />
      ),
      facePatch: c.light,
      mouth: 'cat',
      blush: '#b39cff',
    }
  },

  star(g, c) {
    const antennas = g.stage === 1 ? [0] : g.stage === 2 ? [-22, 22] : [-28, 0, 28]
    const ring =
      g.stage === 3
        ? {
            back: (
              <path
                d={`M${f(g.cx - g.rx - 12)} ${f(g.cy + 4)}A${f(g.rx + 12)} 9 -12 0 1 ${f(g.cx + g.rx + 12)} ${f(g.cy - 6)}`}
                fill="none"
                stroke={OUT}
                strokeWidth={7}
                strokeLinecap="round"
              />
            ),
            backFill: (
              <path
                d={`M${f(g.cx - g.rx - 12)} ${f(g.cy + 4)}A${f(g.rx + 12)} 9 -12 0 1 ${f(g.cx + g.rx + 12)} ${f(g.cy - 6)}`}
                fill="none"
                stroke={c.accent}
                strokeWidth={3.4}
                strokeLinecap="round"
              />
            ),
            front: (
              <>
                <path
                  d={`M${f(g.cx + g.rx + 12)} ${f(g.cy - 6)}A${f(g.rx + 12)} 9 -12 0 1 ${f(g.cx - g.rx - 12)} ${f(g.cy + 4)}`}
                  fill="none"
                  stroke={OUT}
                  strokeWidth={7}
                  strokeLinecap="round"
                />
                <path
                  d={`M${f(g.cx + g.rx + 12)} ${f(g.cy - 6)}A${f(g.rx + 12)} 9 -12 0 1 ${f(g.cx - g.rx - 12)} ${f(g.cy + 4)}`}
                  fill="none"
                  stroke={c.accent}
                  strokeWidth={3.4}
                  strokeLinecap="round"
                />
              </>
            ),
          }
        : null
    const specks = { 1: [[-0.55, 0.35]], 2: [[-0.6, 0.3], [0.55, 0.45]], 3: [[-0.62, 0.25], [0.6, 0.4], [-0.3, 0.7], [0.3, 0.72]] }[g.stage]
    return {
      back: (
        <>
          {ring?.back}
          {ring?.backFill}
          {antennas.map((a) => {
            const base = { x: g.cx + a * 0.25, y: g.top + 3 }
            const rad = (a * Math.PI) / 180
            const len = 12 + 2 * g.stage
            const tip = { x: base.x + Math.sin(rad) * len, y: base.y - Math.cos(rad) * len }
            return (
              <g key={a}>
                <path d={`M${f(base.x)} ${f(base.y)}L${f(tip.x)} ${f(tip.y)}`} stroke={OUT} strokeWidth={2.4} strokeLinecap="round" />
                <polygon points={starPoints(tip.x, tip.y, 5.5 + g.stage * 0.6)} fill={c.accent} {...ink} strokeWidth={1.8} />
              </g>
            )
          })}
        </>
      ),
      front: (
        <>
          {specks.map(([sx, sy]) => (
            <path key={`${sx}`} d={sparklePath(g.cx + sx * g.rx, g.cy + sy * g.ry, 2.6)} fill={c.accent} />
          ))}
        </>
      ),
      over: ring?.front,
      facePatch: c.light,
      mouth: 'smile',
      belly: false,
      blush: '#ff9fc6',
    }
  },
}

const SHAPES: Record<CreatureLine['element'], Shape> = {
  rock: 'round',
  leaf: 'round',
  water: 'drop',
  fire: 'round',
  spark: 'round',
  ice: 'tall',
  wind: 'cloud',
  bloom: 'pear',
  crystal: 'round',
  light: 'round',
  shadow: 'tall',
  star: 'round',
}

function Face({ g, parts }: { g: Geo; parts: Parts }) {
  const { cx, fy, ex, er } = g
  const ery = er * 1.18
  const mouth = parts.mouth ?? 'smile'
  const my = fy + er + 3.2
  return (
    <g>
      {parts.facePatch && <ellipse cx={cx} cy={fy + 2} rx={ex + er + 4.5} ry={er + 6} fill={parts.facePatch} />}
      {parts.eyeDiscs &&
        [-1, 1].map((side) => <circle key={side} cx={cx + side * ex} cy={fy} r={er * 1.75} fill={parts.eyeDiscs} stroke={OUT} strokeWidth={1.6} />)}
      {[-1, 1].map((side) => (
        <g key={side}>
          <ellipse cx={f(cx + side * ex)} cy={f(fy)} rx={er} ry={f(ery)} fill={OUT} />
          <circle cx={f(cx + side * ex - er * 0.32)} cy={f(fy - ery * 0.38)} r={f(er * 0.42)} fill="#fff" />
          <circle cx={f(cx + side * ex + er * 0.35)} cy={f(fy + ery * 0.35)} r={f(er * 0.2)} fill="#fff" />
        </g>
      ))}
      {parts.blush !== null &&
        [-1, 1].map((side) => (
          <ellipse key={side} cx={f(cx + side * (ex + er + 1.8))} cy={f(fy + er + 1.5)} rx={3} ry={1.8} fill={parts.blush ?? '#ff8fb1'} opacity={0.7} />
        ))}
      {parts.freckles &&
        [-1, 1].map((side) =>
          [0, 1, 2].map((i) => (
            <circle key={`${side}-${i}`} cx={f(cx + side * (ex + er + 0.5 + i * 2.2))} cy={f(fy + er + 1 + (i === 1 ? -1.6 : 0))} r={0.9} fill={parts.freckles} />
          )),
        )}
      {mouth === 'smile' && <path d={`M${f(cx - 3)} ${f(my)}q3 3 6 0`} fill="none" stroke={OUT} strokeWidth={2} strokeLinecap="round" />}
      {mouth === 'cat' && <path d={`M${f(cx - 3.4)} ${f(my)}q1.7 2.2 3.4 0q1.7 2.2 3.4 0`} fill="none" stroke={OUT} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />}
      {mouth === 'open' && <path d={`M${f(cx - 3.2)} ${f(my - 0.6)}q3.2 5.6 6.4 0Z`} fill="#e9576f" stroke={OUT} strokeWidth={1.8} strokeLinejoin="round" />}
      {mouth === 'fang' && (
        <>
          <path d={`M${f(cx - 3.6)} ${f(my)}q3.6 3.4 7.2 0`} fill="none" stroke={OUT} strokeWidth={2} strokeLinecap="round" />
          <path d={`M${f(cx + 1.2)} ${f(my + 1.2)}l1.2 2.6l1.1 -2.9`} fill="#fff" stroke={OUT} strokeWidth={1.2} strokeLinejoin="round" />
        </>
      )}
    </g>
  )
}

/** Gold sparkles and a glow for a shiny final form. */
function Shine({ behind }: { behind: boolean }) {
  if (behind) {
    return (
      <g>
        <circle cx={50} cy={58} r={44} fill="#fff1a8" opacity={0.45} />
        <circle cx={50} cy={58} r={36} fill="#ffe36b" opacity={0.35} />
      </g>
    )
  }
  return (
    <g>
      {[
        [14, 24, 7],
        [86, 30, 6],
        [10, 62, 4.5],
        [90, 70, 5],
        [76, 10, 4],
      ].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={sparklePath(x, y, r)} fill="#ffd23f" stroke={OUT} strokeWidth={1.4} strokeLinejoin="round" />
      ))}
    </g>
  )
}

/** One creature at a stage: 1 baby, 2 evolved, 3 final form, 4 shiny final form. */
export function CreatureBody({ line, stage }: { line: CreatureLine; stage: 1 | 2 | 3 | 4 }) {
  const form = (stage === 4 ? 3 : stage) as Stage
  const shape = SHAPES[line.element]
  const g = geo(form, shape)
  const c = line.colors
  const parts = FEATURES[line.element](g, c)
  const body = bodyPaths(g, shape)
  return (
    <g>
      {stage === 4 && <Shine behind />}
      {parts.back}
      {parts.feet !== false &&
        [-1, 1].map((side) => (
          <ellipse key={side} cx={f(g.cx + side * g.rx * 0.45)} cy={f(g.bottom - 1)} rx={f(g.rx * 0.24)} ry={f(g.ry * 0.16)} fill={c.dark} {...ink} />
        ))}
      <Union paths={body} fill={c.main} />
      {parts.belly !== false && <ellipse cx={g.cx} cy={f(g.cy + g.ry * 0.45)} rx={f(g.rx * 0.56)} ry={f(g.ry * 0.4)} fill={c.light} />}
      {parts.front}
      <Face g={g} parts={parts} />
      {parts.over}
      {stage === 4 && <Shine behind={false} />}
    </g>
  )
}

const EGG = 'M50 12C69 12 81 42 81 60C81 78 68 89 50 89C32 89 19 78 19 60C19 42 31 12 50 12Z'

/** The pattern on each line's egg, so kids can guess what's inside. */
function eggPattern(line: CreatureLine): ReactNode {
  const c = line.colors
  switch (line.element) {
    case 'rock':
      return [
        [36, 40, 5],
        [60, 30, 3.5],
        [64, 56, 6],
        [40, 70, 4],
        [54, 78, 3],
        [28, 58, 3],
      ].map(([x, y, r]) => <circle key={`${x}`} cx={x} cy={y} r={r} fill={c.accent2} opacity={0.85} />)
    case 'leaf':
      return [
        [36, 46, -30],
        [62, 36, 25],
        [58, 68, -20],
        [34, 74, 35],
      ].map(([x, y, a]) => <Leaf key={`${x}`} x={x} y={y + 6} len={14} w={7} angle={a} fill={c.accent} />)
    case 'water':
      return <path d="M10 58q10 -8 20 0t20 0t20 0t20 0v12q-10 -8 -20 0t-20 0t-20 0t-20 0Z" fill={c.dark} opacity={0.75} />
    case 'fire':
      return <path d="M10 70l8 -14l6 9l8 -18l7 14l8 -20l8 18l7 -14l8 18l9 -12l8 19v30h-90Z" fill={c.accent2} opacity={0.85} />
    case 'spark':
      return <path d="M10 50l12 8l12 -8l12 8l12 -8l12 8l12 -8l12 8v8l-12 -8l-12 8l-12 -8l-12 8l-12 -8l-12 8l-12 -8Z" fill={c.accent} stroke={OUT} strokeWidth={1.2} />
    case 'ice':
      return (
        <g>
          <path d="M10 12h90v18l-8 12l-7 -10l-8 14l-7 -12l-8 16l-8 -14l-7 12l-8 -14l-7 10l-8 -12l-7 8Z" fill={c.dark} opacity={0.55} />
          {[
            [40, 64, 6],
            [62, 74, 4.5],
          ].map(([x, y, r]) =>
            [0, 60, 120].map((a) => {
              const rad = (a * Math.PI) / 180
              return (
                <path
                  key={`${x}-${a}`}
                  d={`M${f(x - Math.cos(rad) * r)} ${f(y - Math.sin(rad) * r)}L${f(x + Math.cos(rad) * r)} ${f(y + Math.sin(rad) * r)}`}
                  stroke={c.dark}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )
            }),
          )}
        </g>
      )
    case 'wind':
      return [
        [38, 40],
        [62, 58],
        [40, 72],
      ].map(([x, y]) => <path key={`${x}`} d={`M${x} ${y}c4 0 4 -6 0 -6c-6 0 -7 9 0 10c9 0 10 -12 1 -14`} fill="none" stroke={c.dark} strokeWidth={2.4} strokeLinecap="round" />)
    case 'bloom':
      return [
        [38, 38],
        [64, 52],
        [42, 70],
      ].map(([x, y]) => (
        <g key={`${x}`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={f(x + Math.cos((a * Math.PI) / 180) * 4)} cy={f(y + Math.sin((a * Math.PI) / 180) * 4)} r={3} fill={c.accent2} />
          ))}
          <circle cx={x} cy={y} r={2.2} fill="#ffd84d" />
        </g>
      ))
    case 'crystal':
      return <path d="M10 64l14 -12l10 12l12 -16l10 16l12 -14l10 14l12 -12v50h-90Z" fill={c.accent} stroke={OUT} strokeWidth={1.2} opacity={0.9} />
    case 'light':
      return (
        <g>
          <circle cx={50} cy={56} r={11} fill={c.accent} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4
            return <path key={i} d={`M${f(50 + Math.cos(a) * 15)} ${f(56 + Math.sin(a) * 15)}L${f(50 + Math.cos(a) * 21)} ${f(56 + Math.sin(a) * 21)}`} stroke={c.accent} strokeWidth={3} strokeLinecap="round" />
          })}
        </g>
      )
    case 'shadow':
      return (
        <g>
          <path d="M56 32a14 14 0 1 0 8 24a11 11 0 1 1 -8 -24Z" fill={c.accent} />
          <path d={sparklePath(34, 68, 3)} fill={c.accent} />
          <path d={sparklePath(62, 74, 2.4)} fill={c.accent} />
        </g>
      )
    case 'star':
      return [
        [38, 40, 6],
        [62, 54, 7],
        [40, 72, 4.5],
        [64, 30, 3.5],
      ].map(([x, y, r]) => <polygon key={`${x}`} points={starPoints(x, y, r)} fill={c.accent} />)
  }
}

export function EggBody({ line }: { line: CreatureLine }) {
  const id = `egg${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const base = line.element === 'shadow' || line.element === 'star' ? line.colors.main : line.colors.light
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={EGG} />
        </clipPath>
      </defs>
      <path d={EGG} fill={base} />
      <g clipPath={`url(#${id})`}>{eggPattern(line)}</g>
      <path d={EGG} fill="none" stroke={OUT} strokeWidth={SW} />
      <path d="M36 28q-5 6 -6 14" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" opacity={0.8} />
    </g>
  )
}

/** A creature (or its egg) as a standalone picture. Stage 0 is the egg. */
export function CreatureArt({
  table,
  stage,
  size,
  fit = false,
  className = '',
}: {
  table: number
  stage: number
  size?: number
  /** Frame the picture tight, so a baby fills it as well as a grown creature does. */
  fit?: boolean
  className?: string
}) {
  const line = LINES[table - 1]
  const s = Math.max(0, Math.min(4, stage))
  const view = fit ? ['4 4 92 92', '13 22 74 74', '7 13 86 86', '0 0 100 100', '0 0 100 100'][s] : '0 0 100 100'
  return (
    <svg
      className={`creature ${s === 0 ? 'is-egg' : ''} ${s === 4 ? 'is-shiny' : ''} ${className}`}
      viewBox={view}
      width={size}
      height={size}
      role="img"
      aria-label={creatureName(line, s)}
    >
      {s === 0 ? <EggBody line={line} /> : <CreatureBody line={line} stage={s as 1 | 2 | 3 | 4} />}
    </svg>
  )
}
