import { createProgress, DEFAULT_SETTINGS } from './engine/progress'
import type { AnswerRecord, Progress } from './engine/types'

const KEY = 'times-table-diary'
const LINK_KEY = 'times-table-diary-cloud'
const QUEUE_KEY = 'times-table-diary-answers'
/** Answers kept while offline before the oldest are dropped. */
const MAX_QUEUE = 5000

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing or full storage: keep playing from memory.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing saved to remove.
  }
}

export function loadProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseProgress(raw) : null
  } catch {
    return null
  }
}

/** Saves locally. `touch` marks it as changed on this device so the next sync uploads it. */
export function saveProgress(p: Progress, { touch = true } = {}): void {
  if (touch) p.updatedAt = Date.now()
  write(KEY, p)
}

/** Forgets this diary on this device: progress, online link, and unsent answers. */
export function eraseLocalDiary(): void {
  remove(KEY)
  remove(LINK_KEY)
  remove(QUEUE_KEY)
}

/** Reads saved, downloaded, or backed-up JSON, filling in anything missing. Throws if it isn't a diary. */
export function parseProgress(raw: string): Progress {
  const data = JSON.parse(raw) as Partial<Progress> | null
  if (!data || data.version !== 1 || typeof data.facts !== 'object' || data.facts === null) {
    throw new Error("That file isn't a Times Table Diary backup.")
  }
  const blank = createProgress(String(data.name ?? ''), Number(data.createdDay ?? 0))
  const list = <T>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : [])
  return {
    ...blank,
    ...data,
    facts: { ...blank.facts, ...data.facts },
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    motor: list(data.motor),
    entries: list(data.entries),
    stickers: list(data.stickers),
    checkups: list(data.checkups),
    lastCheckupDay: Number(data.lastCheckupDay ?? -1),
    settingsAt: Number(data.settingsAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  }
}

/** The server copy this device syncs with. */
export interface CloudLink {
  id: string
  /** Server version this device last synced with. */
  version: number
  syncedAt: number
}

export function loadLink(): CloudLink | null {
  return read<CloudLink>(LINK_KEY)
}

export function saveLink(link: CloudLink): void {
  write(LINK_KEY, link)
}

/** Answers waiting to be uploaded. */
export function loadQueue(): AnswerRecord[] {
  return read<AnswerRecord[]>(QUEUE_KEY) ?? []
}

export function queueAnswer(answer: AnswerRecord): void {
  write(QUEUE_KEY, [...loadQueue(), answer].slice(-MAX_QUEUE))
}

/** Drops the oldest `count` answers once the server has them. */
export function dropQueued(count: number): void {
  write(QUEUE_KEY, loadQueue().slice(count))
}

/** Asks the browser not to clear this site's storage when space runs low. */
export function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => {})
}

/** Saves a backup file through the share sheet on iPad, or as a download elsewhere. */
export async function shareBackup(p: Progress): Promise<void> {
  const name = `times-table-diary-${new Date().toISOString().slice(0, 10)}.json`
  const file = new File([JSON.stringify(p, null, 2)], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Times Table Diary backup' })
    return
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
