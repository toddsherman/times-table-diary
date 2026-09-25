const SPIKES = 14
const BURST_POINTS = Array.from({ length: SPIKES * 2 }, (_, i) => {
  const r = i % 2 === 0 ? 96 : 72
  const angle = (Math.PI * i) / SPIKES - Math.PI / 2
  return `${Math.round(100 + r * Math.cos(angle))},${Math.round(100 + r * Math.sin(angle))}`
}).join(' ')

/** The comic-style "SQUEEE!" pop after a right answer. */
export function Burst({ text, big }: { text: string; big: boolean }) {
  return (
    <div className={`burst ${big ? 'big' : ''}`} role="status">
      <svg viewBox="0 0 200 200" className="burst-shape" aria-hidden="true">
        <polygon points={BURST_POINTS} />
      </svg>
      <span className="burst-text">{text}</span>
    </div>
  )
}
