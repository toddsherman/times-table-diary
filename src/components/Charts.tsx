import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { dateFromDay } from '../engine/dates'
import { longDay, shortDay } from '../format'

// One series, one hue; validated for contrast on the white card (dataviz validate_palette).
const MARK = '#7c4ddb'
const GRID = '#ebe7f3'

const W = 640
const H = 240
const M = { left: 40, right: 46, top: 14, bottom: 30 }

/** Mastered facts over time: one line on a fixed 0–144 scale, with a crosshair on hover, tap, or arrow keys. */
export function MasteryChart({ points, max = 144 }: { points: Array<{ day: number; mastered: number }>; max?: number }) {
  const [active, setActive] = useState<number | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const first = points[0].day
  const last = points[points.length - 1].day
  const end = points[points.length - 1]
  const x = (day: number) => M.left + ((day - first) / Math.max(1, last - first)) * (W - M.left - M.right)
  const y = (value: number) => H - M.bottom - (value / max) * (H - M.top - M.bottom)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.mastered).toFixed(1)}`).join('')
  const area = `${line}L${x(last).toFixed(1)},${y(0)}L${x(first).toFixed(1)},${y(0)}Z`

  const snap = (e: PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const px = ((e.clientX - box.left) / box.width) * W
    let nearest = 0
    points.forEach((p, i) => {
      if (Math.abs(x(p.day) - px) < Math.abs(x(points[nearest].day) - px)) nearest = i
    })
    setActive(nearest)
  }
  const step = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? points.length) - 1))
    else if (e.key === 'ArrowRight') setActive((i) => Math.min(points.length - 1, (i ?? -1) + 1))
    else return
    e.preventDefault()
  }
  const a = active === null ? null : points[active]

  return (
    <div className="chart">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Facts mastered over time: ${points[0].mastered} on ${longDay(first)}, ${end.mastered} on ${longDay(last)}`}
        tabIndex={0}
        onPointerMove={snap}
        onPointerDown={snap}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={step}
      >
        {[0, 36, 72, 108, 144].map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="tick">
              {t}
            </text>
          </g>
        ))}
        <path d={area} fill={MARK} opacity={0.1} />
        <path d={line} fill="none" stroke={MARK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(last)} cy={y(end.mastered)} r={6.5} fill="#fff" />
        <circle cx={x(last)} cy={y(end.mastered)} r={4.5} fill={MARK} />
        <text x={x(last) + 11} y={y(end.mastered) + 5} className="end-label">
          {end.mastered}
        </text>
        <text x={M.left} y={H - 8} className="tick">
          {shortDay(first)}
        </text>
        <text x={W - M.right} y={H - 8} textAnchor="end" className="tick">
          {shortDay(last)}
        </text>
        {a && (
          <g pointerEvents="none">
            <line x1={x(a.day)} x2={x(a.day)} y1={M.top} y2={H - M.bottom} stroke="#bdb4d3" strokeWidth={1} />
            <circle cx={x(a.day)} cy={y(a.mastered)} r={6.5} fill="#fff" />
            <circle cx={x(a.day)} cy={y(a.mastered)} r={4.5} fill={MARK} />
          </g>
        )}
      </svg>
      {a && (
        <div className="chart-tip" style={{ left: `${Math.min(86, Math.max(14, (x(a.day) / W) * 100))}%` }}>
          <strong>{a.mastered} mastered</strong>
          <span>{longDay(a.day)}</span>
        </div>
      )}
    </div>
  )
}

/** Each times table as a meter against its 12 facts. Tapping one lists what's left. */
export function TableMeters({ tables, missing }: { tables: Array<{ table: number; mastered: number }>; missing: (table: number) => string[] }) {
  const [active, setActive] = useState<number | null>(null)
  const left = active === null ? [] : missing(active)
  return (
    <>
      <ul className="meters">
        {tables.map(({ table, mastered }) => (
          <li key={table}>
            <button
              type="button"
              className={`meter-row ${active === table ? 'on' : ''}`}
              aria-label={`${table} times table: ${mastered} of 12 facts mastered`}
              onPointerEnter={() => setActive(table)}
              onFocus={() => setActive(table)}
              onClick={() => setActive(table)}
            >
              <span className="meter-label">×{table}</span>
              <span className="meter-track">
                <span className="meter-fill" style={{ width: `${(mastered / 12) * 100}%` }} />
              </span>
              <span className="meter-value">{mastered} of 12</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="chart-detail" aria-live="polite">
        {active === null
          ? 'Tap a table to see which facts are still to master.'
          : left.length === 0
            ? `Every fact in the ${active}s is mastered!`
            : `Still to master in the ${active}s: ${left.join(', ')}`}
      </p>
    </>
  )
}

/** The last four weeks of diary entries, laid out by weekday. */
export function PracticeCalendar({ days }: { days: Array<{ day: number; entries: number }> }) {
  const [active, setActive] = useState<number | null>(null)
  const offset = dateFromDay(days[0].day).getDay()
  const today = days[days.length - 1].day
  const a = days.find((d) => d.day === active)
  const describe = (n: number) => (n === 0 ? 'no diary entry' : `${n} diary ${n === 1 ? 'entry' : 'entries'}`)
  return (
    <>
      <div className="calendar">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="cal-head" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            className={`cal-cell c${Math.min(d.entries, 2)} ${d.day === today ? 'today' : ''} ${d.day === active ? 'on' : ''}`}
            aria-label={`${longDay(d.day)}: ${describe(d.entries)}`}
            onPointerEnter={() => setActive(d.day)}
            onFocus={() => setActive(d.day)}
            onClick={() => setActive(d.day)}
          />
        ))}
      </div>
      <div className="cal-legend" aria-hidden="true">
        <span>
          <i className="cal-cell c0" /> No entry
        </span>
        <span>
          <i className="cal-cell c1" /> 1 entry
        </span>
        <span>
          <i className="cal-cell c2" /> 2 or more
        </span>
      </div>
      <p className="chart-detail" aria-live="polite">
        {a ? `${longDay(a.day)}: ${describe(a.entries)}` : 'Tap a day for details.'}
      </p>
    </>
  )
}
