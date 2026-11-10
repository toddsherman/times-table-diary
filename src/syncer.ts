import type { Progress } from './engine/types'
import type { CloudLink } from './storage'

export interface SyncStatus {
  state: 'off' | 'syncing' | 'saved' | 'error'
  at?: number
  message?: string
}

/** What the sync loop needs from the device and the server, so tests can stand in for both. */
export interface SyncDeps {
  loadLink(): CloudLink | null
  loadProgress(): Progress | null
  flushAnswers(link: CloudLink): Promise<void>
  syncDiary(local: Progress, link: CloudLink): Promise<{ progress: Progress; link: CloudLink }>
  /** The server's copy, for a device that has the link but lost its own copy. */
  fetchDiary(link: CloudLink): Promise<{ progress: Progress; link: CloudLink }>
  saveLink(link: CloudLink): void
  /** Saves the merged diary on this device and shows it. */
  applyProgress(progress: Progress): void
  /** True while a screen is changing the diary answer by answer (practice); the merge waits for the next sync. */
  holdsDiary(): boolean
  onStatus(update: (status: SyncStatus) => SyncStatus): void
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Returns `syncNow`: uploads new answers, then merges this device's diary with the server's copy.
 * Calls made while one is running are folded into one more round afterwards.
 *
 * A round reads the diary, then waits on the network. Whatever changed on the device in the
 * meantime (a setting, a finished page, the diary being forgotten) must not be overwritten by
 * that round's result, so the result is only applied if the diary is still as it was read.
 */
export function createSyncer(deps: SyncDeps): () => Promise<void> {
  let running = false
  let again = false

  async function round(): Promise<void> {
    const link = deps.loadLink()
    if (!link) return
    const local = deps.loadProgress()
    deps.onStatus((s) => ({ ...s, state: 'syncing' }))
    try {
      if (!local) {
        // The link is here but the diary isn't (its saved copy couldn't be read): bring it back.
        const found = await deps.fetchDiary(link)
        if (deps.loadLink()?.id !== link.id || deps.loadProgress()) return
        deps.saveLink(found.link)
        deps.applyProgress(found.progress)
        deps.onStatus(() => ({ state: 'saved', at: found.link.syncedAt }))
        return
      }
      await deps.flushAnswers(link)
      const result = await deps.syncDiary(local, link)
      // Forgotten, deleted, or swapped for another diary while this was on its way: leave it be.
      const now = deps.loadProgress()
      if (deps.loadLink()?.id !== link.id || !now) return
      deps.saveLink(result.link)
      if (deps.holdsDiary()) {
        // Mid-session, the practice screen owns the diary; the merge is applied on the next sync.
      } else if (same(now, local)) {
        deps.applyProgress(result.progress)
      } else {
        // The diary changed on this device meanwhile. Keep that, and sync again with it.
        again = true
      }
      deps.onStatus(() => ({ state: 'saved', at: result.link.syncedAt }))
    } catch (err) {
      deps.onStatus((s) => ({ ...s, state: 'error', message: err instanceof Error ? err.message : String(err) }))
    }
  }

  return async function syncNow(): Promise<void> {
    if (running) {
      again = true
      return
    }
    running = true
    try {
      do {
        again = false
        await round()
      } while (again)
    } finally {
      running = false
    }
  }
}
