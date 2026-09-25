import { BackspaceIcon } from './Icons'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'go'] as const
export type Key = (typeof KEYS)[number]

/**
 * A big on-screen number pad. Keys fire on pointerdown so taps feel instant,
 * and never focus an input, so the iPad keyboard stays hidden.
 */
export function Keypad({ onKey }: { onKey: (key: Key) => void }) {
  return (
    <div className="keypad">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className={`key key-${key}`}
          aria-label={key === 'back' ? 'Delete' : key === 'go' ? 'Check' : key}
          onPointerDown={(e) => {
            e.preventDefault()
            onKey(key)
          }}
          onClick={(e) => {
            // Keyboard activation (Enter/Space on a focused key) arrives as a click with no pointer.
            if (e.detail === 0) onKey(key)
          }}
        >
          {key === 'back' ? <BackspaceIcon /> : key === 'go' ? 'Go!' : key}
        </button>
      ))}
    </div>
  )
}
