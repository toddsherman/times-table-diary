import { useState, type FormEvent } from 'react'
import { Sticker } from '../components/Sticker'

interface Props {
  onCreate: (name: string, pin: string) => Promise<void>
  onOpen: (name: string, pin: string) => Promise<void>
}

export function Welcome({ onCreate, onOpen }: Props) {
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
      <div className="card cover tape">
        <p className="stamp">Top secret! Keep out!</p>
        <h1 className="bubble-title">Times Table Diary</h1>
        <p className="tagline">Tales from a Not-So-Secret Math Genius</p>
        <div className="cover-doodles" aria-hidden="true">
          <Sticker id="star" size={56} />
          <Sticker id="heart" size={48} />
          <Sticker id="bolt" size={52} />
        </div>
        <form className="name-form" onSubmit={submit}>
          <label htmlFor="owner">{creating ? 'This diary belongs to:' : 'Whose diary is it?'}</label>
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
            {creating
              ? 'A grown-up picks this. Write it down: you need the name and PIN to open the diary on another device.'
              : 'Use the same name and family PIN you started the diary with.'}
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn pink big" disabled={busy}>
            {busy ? 'Just a sec…' : creating ? 'Start my diary' : 'Open my diary'}
          </button>
          <button type="button" className="link-btn" onClick={switchMode}>
            {creating ? 'Already have a diary? Open it' : 'Start a new diary instead'}
          </button>
        </form>
      </div>
    </div>
  )
}
