import { BackIcon } from './Icons'

export function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="top-bar">
      <button type="button" className="back-btn" onClick={onBack}>
        <BackIcon /> Back
      </button>
      <h1 className="bubble-title small">{title}</h1>
    </header>
  )
}
