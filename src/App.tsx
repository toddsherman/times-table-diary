import { useCallback, useEffect, useRef, useState } from 'react'
import { createDiary, deleteDiary, flushAnswers, openDiary, saveOnExit, syncDiary } from './cloud'
import { dayNumber } from './engine/dates'
import { createProgress } from './engine/progress'
import type { DiaryEntry, Progress } from './engine/types'
import { DiaryBook } from './screens/DiaryBook'
import { DoodlePage } from './screens/DoodlePage'
import { EntryDone } from './screens/EntryDone'
import { Home } from './screens/Home'
import { Practice } from './screens/Practice'
import { Report } from './screens/Report'
import { Settings, type SyncStatus } from './screens/Settings'
import { Welcome } from './screens/Welcome'
import { setSoundOn } from './sound'
import { eraseLocalDiary, loadLink, loadProgress, requestPersistence, saveLink, saveProgress, type CloudLink } from './storage'

type Screen = 'home' | 'practice' | 'done' | 'doodles' | 'diary' | 'settings' | 'report'

export default function App() {
  const [progress, setProgress] = useState<Progress | null>(loadProgress)
  const [link, setLink] = useState<CloudLink | null>(loadLink)
  const [screen, setScreen] = useState<Screen>('home')
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [sync, setSync] = useState<SyncStatus>(() => ({ state: loadLink() ? 'saved' : 'off', at: loadLink()?.syncedAt }))
  const screenRef = useRef(screen)
  const running = useRef(false)
  const again = useRef(false)
  const soundOn = progress?.settings.sound ?? true

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  useEffect(() => {
    setSoundOn(soundOn)
  }, [soundOn])

  useEffect(() => {
    // Block body on purpose: scrollTo returns a Promise in newer browsers, which React would treat as a cleanup.
    window.scrollTo(0, 0)
  }, [screen])

  /** Uploads new answers, then merges this device's diary with the server's copy. */
  const syncNow = useCallback(async () => {
    if (running.current) {
      again.current = true
      return
    }
    running.current = true
    do {
      again.current = false
      const current = loadLink()
      const local = loadProgress()
      if (!current || !local) break
      setSync((s) => ({ ...s, state: 'syncing' }))
      try {
        await flushAnswers(current)
        const result = await syncDiary(local, current)
        saveLink(result.link)
        setLink(result.link)
        // Mid-session, the practice screen owns the diary; the merge is applied on the next sync.
        if (screenRef.current !== 'practice') {
          saveProgress(result.progress, { touch: false })
          setProgress(result.progress)
        }
        setSync({ state: 'saved', at: result.link.syncedAt })
      } catch (err) {
        setSync((s) => ({ ...s, state: 'error', message: err instanceof Error ? err.message : String(err) }))
      }
    } while (again.current)
    running.current = false
  }, [])

  useEffect(() => {
    const first = window.setTimeout(() => void syncNow(), 0)
    const onOnline = () => void syncNow()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') return void syncNow()
      const current = loadLink()
      const local = loadProgress()
      if (current && local) saveOnExit(local, current)
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(first)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [syncNow])

  const commit = (next: Progress) => {
    saveProgress(next)
    setProgress(next)
    void syncNow()
  }

  const start = (p: Progress, l: CloudLink) => {
    saveLink(l)
    setLink(l)
    setSync({ state: 'saved', at: l.syncedAt })
    setProgress(p)
    requestPersistence()
  }

  const goHome = () => setScreen('home')

  if (!progress) {
    return (
      <Welcome
        onCreate={async (name, pin) => {
          const fresh = createProgress(name, dayNumber())
          fresh.settingsAt = fresh.updatedAt = Date.now()
          const l = await createDiary(name, pin, fresh)
          saveProgress(fresh, { touch: false })
          start(fresh, l)
        }}
        onOpen={async (name, pin) => {
          const { progress: opened, link: l } = await openDiary(name, pin)
          saveProgress(opened, { touch: false })
          start(opened, l)
        }}
      />
    )
  }

  switch (screen) {
    case 'practice':
      return (
        <Practice
          progress={progress}
          onQuit={(p) => {
            commit(p)
            goHome()
          }}
          onFinish={(p, e) => {
            commit(p)
            setEntry(e)
            setScreen('done')
          }}
        />
      )
    case 'done':
      if (entry) return <EntryDone entry={entry} name={progress.name} onClose={goHome} />
      break
    case 'doodles':
      return <DoodlePage progress={progress} onBack={goHome} />
    case 'diary':
      return <DiaryBook progress={progress} onBack={goHome} />
    case 'report':
      return <Report progress={progress} link={link} onBack={() => setScreen('settings')} />
    case 'settings':
      return (
        <Settings
          progress={progress}
          link={link}
          sync={sync}
          onChange={commit}
          onSyncNow={() => void syncNow()}
          onConnect={async (pin) => {
            const l = await createDiary(progress.name, pin, progress)
            start(progress, l)
          }}
          onForget={() => {
            eraseLocalDiary()
            setProgress(null)
            setLink(null)
            setSync({ state: 'off' })
            goHome()
          }}
          onDeleteEverywhere={async () => {
            if (link) await deleteDiary(link)
            eraseLocalDiary()
            setProgress(null)
            setLink(null)
            setSync({ state: 'off' })
            goHome()
          }}
          onReport={() => setScreen('report')}
          onBack={goHome}
        />
      )
  }

  return (
    <Home
      progress={progress}
      onStart={() => setScreen('practice')}
      onDoodles={() => setScreen('doodles')}
      onDiary={() => setScreen('diary')}
      onSettings={() => setScreen('settings')}
    />
  )
}
