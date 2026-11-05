import { useRef, useState, type ChangeEvent } from 'react'
import { ThemePicker } from '../components/ThemePicker'
import { TopBar } from '../components/TopBar'
import { dayNumber } from '../engine/dates'
import { ALL_FACT_IDS } from '../engine/facts'
import { fastThreshold, levelCounts, masteredCount, withSettings } from '../engine/progress'
import { mergeProgress } from '../engine/sync'
import type { Progress, Settings as DiarySettings } from '../engine/types'
import { timeAgo } from '../format'
import { parseProgress, shareBackup, type CloudLink } from '../storage'
import { useTheme } from '../themes'

export interface SyncStatus {
  state: 'off' | 'syncing' | 'saved' | 'error'
  at?: number
  message?: string
}

interface Props {
  progress: Progress
  link: CloudLink | null
  sync: SyncStatus
  onChange: (p: Progress) => void
  onSyncNow: () => void
  onConnect: (pin: string) => Promise<void>
  onForget: () => void
  onDeleteEverywhere: () => Promise<void>
  onReport: () => void
  onBack: () => void
}

/** "Today: 3 of 5 parts done · 12 minutes so far", or that the page hasn't been started. */
function todayLine(p: Progress): string {
  const log = p.days.find((d) => d.day === dayNumber())
  if (!log || log.questions === 0) return "Today's page hasn't been started yet."
  const minutes = Math.round(log.activeMs / 60_000)
  const time = minutes < 1 ? 'under a minute' : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  return log.done === log.parts ? `Today's page is done: ${time} of practice.` : `Today: ${log.done} of ${log.parts} parts done · ${time} so far.`
}

export function Settings({ progress, link, sync, onChange, onSyncNow, onConnect, onForget, onDeleteEverywhere, onReport, onBack }: Props) {
  const [confirm, setConfirm] = useState<'forget' | 'delete' | null>(null)
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const { settings } = progress
  const { id: theme, words } = useTheme()
  const { thing } = words
  const counts = levelCounts(progress)
  const owner = progress.name

  const changeSettings = (patch: Partial<DiarySettings>) => onChange(withSettings(progress, patch))

  const connect = async () => {
    if (!/^\d{4,8}$/.test(pin)) return setPinError('The family PIN needs 4 to 8 digits.')
    setBusy(true)
    setPinError('')
    try {
      await onConnect(pin)
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Couldn't save it online. Try again?")
    } finally {
      setBusy(false)
    }
  }

  const deleteEverywhere = async () => {
    setBusy(true)
    try {
      await onDeleteEverywhere()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Couldn't delete it. Try again?")
      setBusy(false)
    }
  }

  const backup = async () => {
    try {
      await shareBackup(progress)
      setMessage('Backup saved.')
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') setMessage("Couldn't save a backup. Try again?")
    }
  }

  const restore = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const restored = parseProgress(await file.text())
      const ok = window.confirm(`Merge the backup of ${restored.name}'s ${thing} (${restored.entries.length} entries) into this one?`)
      if (!ok) return
      onChange({ ...mergeProgress(progress, restored), name: progress.name, updatedAt: Date.now() })
      setMessage('Backup loaded.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That file couldn't be loaded.")
    }
  }

  const syncLine =
    sync.state === 'syncing'
      ? 'Saving…'
      : sync.state === 'error'
        ? `Not saved online right now: ${sync.message ?? 'try again in a bit.'}`
        : sync.at
          ? `Last saved online ${timeAgo(sync.at)}.`
          : 'Saved online.'

  return (
    <div className="screen settings">
      <TopBar title="Grown-ups" onBack={onBack} />

      <section className="card panel">
        <h2>How {owner} is doing</h2>
        <p>
          {masteredCount(progress)} of {ALL_FACT_IDS.length} facts mastered · {counts[1]} being learned · {counts[0]} not started
        </p>
        <p>{todayLine(progress)}</p>
        <p className="note">
          "Fast" currently means within {(fastThreshold(progress.motor, 56) / 1000).toFixed(1)} seconds. It adjusts to how quickly {owner}{' '}
          answers ×1 and ×10 facts, so slow typing isn't mistaken for not knowing.
        </p>
        <div className="row">
          <button type="button" className="btn small purple" onClick={onReport}>
            See progress report
          </button>
        </div>
      </section>

      <section className="card panel">
        <h2>Saved online</h2>
        {link ? (
          <>
            <p>
              Saved as “{owner}” with your family PIN. To open it on another device, pick “Open it” on the first page and enter the
              same name and PIN.
            </p>
            <p className={`note ${sync.state === 'error' ? 'warn' : ''}`}>{syncLine}</p>
            <div className="row">
              <button type="button" className="btn small teal" onClick={onSyncNow} disabled={sync.state === 'syncing'}>
                Save now
              </button>
            </div>
          </>
        ) : (
          <>
            <p>{`This ${thing} is only on this iPad. Pick a family PIN to save it online and keep a progress report.`}</p>
            <input
              className="text-input pin-input small"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 8))
                setPinError('')
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="4 to 8 digits"
              aria-label="Family PIN"
            />
            {pinError && <p className="error">{pinError}</p>}
            <div className="row">
              <button type="button" className="btn small teal" onClick={connect} disabled={busy}>
                Save it online
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card panel">
        <h2>Look</h2>
        <ThemePicker value={theme} onPick={(id) => changeSettings({ theme: id })} label={`${owner}'s look`} />
        <p className="note">Changes the pictures, words, and colors. Progress, stickers, and pages all carry over.</p>
      </section>

      <section className="card panel">
        <h2>Daily page</h2>
        <div className="segmented">
          {[10, 15, 20].map((n) => (
            <button key={n} type="button" className={settings.dailyMinutes === n ? 'on' : ''} onClick={() => changeSettings({ dailyMinutes: n })}>
              {n} minutes
            </button>
          ))}
        </div>
        <p className="note">
          Each day's page is a warm-up, new facts, practice, puzzles, and a lightning lap. The number of questions in each part is
          set from how long {owner}'s questions usually take, so the page lasts about this long. There's no clock on screen. While{' '}
          {owner} knows only a few facts, pages run shorter rather than repeating them. A page already started keeps its size.
        </p>
      </section>

      <section className="card panel">
        <h2>Sounds</h2>
        <div className="segmented">
          {[true, false].map((on) => (
            <button key={String(on)} type="button" className={settings.sound === on ? 'on' : ''} onClick={() => changeSettings({ sound: on })}>
              {on ? 'On' : 'Off'}
            </button>
          ))}
        </div>
      </section>

      <section className="card panel">
        <h2>Backup file</h2>
        <p className="note">An extra copy you keep yourself, in Files or AirDropped to another device.</p>
        <div className="row">
          <button type="button" className="btn small" onClick={backup}>
            Save a backup
          </button>
          <button type="button" className="btn small teal" onClick={() => fileInput.current?.click()}>
            Load a backup
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={restore} />
        </div>
        {message && <p className="note">{message}</p>}
      </section>

      <section className="card panel danger">
        <h2>This iPad</h2>
        {confirm === 'forget' ? (
          <>
            <p>
              This iPad will forget {owner}
              {`'s ${thing}.`}{' '}
              {link ? 'It stays saved online, so you can open it again with the name and PIN.' : "It isn't saved online, so it will be gone."}
              {link && sync.state === 'error' && ' The newest answers may not be saved online yet.'}
            </p>
            <div className="row">
              <button type="button" className="btn small" onClick={() => setConfirm(null)}>
                Keep it
              </button>
              <button type="button" className="btn small pink" onClick={onForget}>
                Forget it on this iPad
              </button>
            </div>
          </>
        ) : confirm === 'delete' ? (
          <>
            <p>
              This permanently deletes {owner}
              {`'s ${thing}, progress, and answers everywhere, online and on this iPad. It can't be undone.`}
            </p>
            <div className="row">
              <button type="button" className="btn small" onClick={() => setConfirm(null)}>
                Keep it
              </button>
              <button type="button" className="btn small pink" onClick={deleteEverywhere} disabled={busy}>
                Delete everywhere
              </button>
            </div>
          </>
        ) : (
          <div className="row">
            <button type="button" className="btn small" onClick={() => setConfirm('forget')}>
              {`Use a different ${thing}…`}
            </button>
            {link && (
              <button type="button" className="btn small" onClick={() => setConfirm('delete')}>
                {`Delete this ${thing} everywhere…`}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
