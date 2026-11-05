import { useState, type FormEvent } from 'react'
import { ThemePicker } from '../components/ThemePicker'
import { useTheme, type ThemeId } from '../themes'

interface Props {
  /** The look picked for the new diary; the whole screen shows it. */
  theme: ThemeId
  onTheme: (id: ThemeId) => void
  onCreate: (name: string, pin: string) => Promise<void>
  onOpen: (name: string, pin: string) => Promise<void>
}

export function Welcome({ theme, onTheme, onCreate, onOpen }: Props) {
  const { words, Cover } = useTheme()
  const [mode, setMode] = useState<'create' | 'open'>('create')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const creating = mode === 'create'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Write your name first!')
    if (!/^\d{4,8}$/.test(pin)) return setError('The family PIN needs 4 to 8 digits.')
    setBusy(true)
    setError('')
    try {
      await (creating ? onCreate : onOpen)(trimmed.slice(0, 20), pin)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again?')
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode(creating ? 'open' : 'create')
    setError('')
  }

  return (
    <div className="screen welcome">
      {creating && <ThemePicker value={theme} onPick={onTheme} label="Pick a look" />}
      <div className="card cover tape">
        <p className="stamp">{words.stamp}</p>
        <h1 className="bubble-title">{words.appTitle}</h1>
        <p className="tagline">{words.tagline}</p>
        <div className="cover-doodles" aria-hidden="true">
          <Cover />
        </div>
        <form className="name-form" onSubmit={submit}>
          <label htmlFor="owner">{creating ? words.belongsTo : words.whose}</label>
          <input
            id="owner"
            className="name-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            maxLength={20}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            placeholder="Your name"
          />
          <label htmlFor="pin" className="pin-label">
            Family PIN
          </label>
          <input
            id="pin"
            className="pin-input"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 8))
              setError('')
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="go"
            placeholder="4 to 8 digits"
          />
          <p className="pin-hint">
            {creating ? words.hintCreate : words.hintOpen}
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn pink big" disabled={busy}>
            {busy ? 'Just a sec…' : creating ? words.startButton : words.openButton}
          </button>
          <button type="button" className="link-btn" onClick={switchMode}>
            {creating ? words.toOpen : words.toCreate}
          </button>
        </form>
      </div>
    </div>
  )
}
