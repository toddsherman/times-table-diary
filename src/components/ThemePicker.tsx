import { THEMES, type ThemeId } from '../themes'

/** A tile per theme, each drawn in its own colors and font, with one of its pictures. */
export function ThemePicker({ value, onPick, label }: { value: ThemeId; onPick: (id: ThemeId) => void; label: string }) {
  return (
    <section className="theme-picker" aria-label={label}>
      <h2 className="theme-picker-title">{label}</h2>
      <div className="theme-tiles" role="radiogroup" aria-label={label}>
        {THEMES.map(({ id, name, blurb, Reward }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            className={`theme-tile ${value === id ? 'on' : ''}`}
            data-pick-theme={id}
            onClick={() => onPick(id)}
          >
            <Reward id="star" size={44} />
            <span className="theme-tile-name">{name}</span>
            <span className="theme-tile-blurb">{blurb}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
