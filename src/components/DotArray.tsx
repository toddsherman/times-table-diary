const STEP = 12
const GROUP_GAP = 5
const PAD = 7
const ROW_COLORS = ['#ff4fa3', '#19c2b0', '#8b5cf6']

const at = (i: number) => PAD + i * STEP + Math.floor(i / 5) * GROUP_GAP

/** `rows` rows of `cols` dots, colored in groups of five rows so "five 8s plus two 8s" is visible. */
export function DotArray({ rows, cols }: { rows: number; cols: number }) {
  const width = at(cols - 1) + PAD
  const height = at(rows - 1) + PAD
  const dots = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(<circle key={`${r}-${c}`} cx={at(c)} cy={at(r)} r={4.3} fill={ROW_COLORS[Math.floor(r / 5)]} />)
    }
  }
  return (
    <figure className="dot-array">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: Math.min(cols * 19, 230) }} role="img" aria-label={`${rows} rows of ${cols} dots`}>
        {dots}
      </svg>
      <figcaption>
        {rows} {rows === 1 ? 'row' : 'rows'} of {cols}
      </figcaption>
    </figure>
  )
}
