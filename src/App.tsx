import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createDiary, deleteDiary, fetchDiary, flushAnswers, openDiary, saveOnExit, syncDiary } from './cloud'
import { dayNumber } from './engine/dates'
import { startNewLesson } from './engine/day'
import { createProgress } from './engine/progress'
import type { DiaryEntry, Progress } from './engine/types'
import { DiaryBook } from './screens/DiaryBook'
import { DoodlePage } from './screens/DoodlePage'
import { EntryDone } from './screens/EntryDone'
import { Home } from './screens/Home'
import { Practice } from './screens/Practice'
import { Report } from './screens/Report'
import { Settings } from './screens/Settings'
import { Welcome } from './screens/Welcome'
import { setSoundOn } from './sound'
import { eraseLocalDiary, loadLink, loadProgress, requestPersistence, saveLink, saveProgress, type CloudLink } from './storage'
import { createSyncer, type SyncStatus } from './syncer'
import { applyTheme, getTheme, ThemeContext, type ThemeId } from './themes'

type Screen = 'home' | 'practice' | 'done' | 'doodles' | 'diary' | 'settings' | 'report'

export default function App() {
  const [progress, setProgress] = useState<Progress | null>(loadProgress)
  const [link, setLink] = useState<CloudLink | null>(loadLink)
  const [screen, setScreen] = useState<Screen>('home')
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [sync, setSync] = useState<SyncStatus>(() => ({ state: loadLink() ? 'saved' : 'off', at: loadLink()?.syncedAt }))
  const screenRef = useRef(screen)
  // The link is here but the diary's saved copy can't be read: wait for the server's before offering a new one.
  const [recovering, setRecovering] = useState(() => loadLink() !== null && loadProgress() === null)
  const soundOn = progress?.settings.sound ?? true
  // Before there's a diary, the welcome screen's picker sets the look.
  const [welcomeTheme, setWelcomeTheme] = useState<ThemeId>('diary')
  const theme = getTheme(progress ? progress.settings.theme : welcomeTheme)

  useLayoutEffect(() => applyTheme(theme), [theme])

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  useEffect(() => {
    setSoundOn(soundOn)
  }, [soundOn])

  // Leaving the welcome screen for home is a new screen too, though `screen` stays 'home'.
  const signedIn = progress !== null
  useEffect(() => {
    // Block body on purpose: scrollTo returns a Promise in newer browsers, which React would treat as a cleanup.
    window.scrollTo(0, 0)
  }, [screen, signedIn])

  /** Uploads new answers, then merges this device's diary with the server's copy (see createSyncer). */
  const syncer = useRef<(() => Promise<void>) | null>(null)
  const syncNow = useCallback(() => {
    syncer.current ??= createSyncer({
      loadLink,
      loadProgress,
      flushAnswers,
      syncDiary,
      fetchDiary,
      saveLink: (l) => {
        saveLink(l)
        setLink(l)
      },
      applyProgress: (p) => {
        saveProgress(p, { touch: false })
        setProgress(p)
      },
      holdsDiary: () => screenRef.current === 'practice',
      onStatus: setSync,
    })
    return syncer.current()
  }, [])

  useEffect(() => {
    const first = window.setTimeout(() => void syncNow().finally(() => setRecovering(false)), 0)
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

  return <ThemeContext.Provider value={theme}>{renderScreen()}</ThemeContext.Provider>

  function renderScreen() {
    if (!progress && recovering) return null
    if (!progress) {
      return (
        <Welcome
          theme={welcomeTheme}
          onTheme={setWelcomeTheme}
          onCreate={async (name, pin) => {
            const fresh = createProgress(name, dayNumber())
            if (welcomeTheme !== 'diary') fresh.settings.theme = welcomeTheme
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
            onBreak={(p) => {
              commit(p)
              goHome()
            }}
            onPageDone={(p, e) => {
              commit(p)
              setEntry(e)
              setScreen('done')
            }}
          />
        )
      case 'done':
        if (entry) return <EntryDone entry={entry} name={progress.name} number={progress.entries.length} onClose={goHome} />
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
        onNewLesson={() => {
          const next = structuredClone(progress)
          startNewLesson(next, dayNumber(), Date.now())
          commit(next)
          setScreen('practice')
        }}
        onDoodles={() => setScreen('doodles')}
        onDiary={() => setScreen('diary')}
        onSettings={() => setScreen('settings')}
      />
    )
  }
}
