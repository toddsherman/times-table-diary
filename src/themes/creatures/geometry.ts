/** Shared drawing helpers for the creatures theme's art. */

/** Outline color for all creature art. */
export const OUT = '#2a3140'

/** Rounds to two decimals, to keep SVG paths short. */
export const f = (n: number) => Math.round(n * 100) / 100

/** A four-point sparkle. */
export function sparklePath(cx: number, cy: number, r: number) {
  const q = r * 0.22
  return `M${f(cx)} ${f(cy - r)}Q${f(cx + q)} ${f(cy - q)} ${f(cx + r)} ${f(cy)}Q${f(cx + q)} ${f(cy + q)} ${f(cx)} ${f(cy + r)}Q${f(cx - q)} ${f(cy + q)} ${f(cx - r)} ${f(cy)}Q${f(cx - q)} ${f(cy - q)} ${f(cx)} ${f(cy - r)}Z`
}

/** A five-point star. */
export function starPoints(cx: number, cy: number, r: number, inner = 0.45) {
  return Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * inner
    const a = (Math.PI * i) / 5 - Math.PI / 2
    return `${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`
  }).join(' ')
}
