/** Path builders shared by the princess drawings. */

export const round = (x: number) => Math.round(x * 10) / 10

/** A four-pointed sparkle with curved sides, centered on (cx, cy). */
export const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${round(cy - r)}Q${cx} ${cy} ${round(cx + r)} ${cy}Q${cx} ${cy} ${cx} ${round(cy + r)}Q${cx} ${cy} ${round(cx - r)} ${cy}Q${cx} ${cy} ${cx} ${round(cy - r)}Z`

/** A five-pointed star centered on (cx, cy), point up. */
export const star = (cx: number, cy: number, outer: number, inner = outer * 0.45) =>
  `${Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / 5) * i - Math.PI / 2
    return `${i === 0 ? 'M' : 'L'}${round(cx + r * Math.cos(a))} ${round(cy + r * Math.sin(a))}`
  }).join('')}Z`
