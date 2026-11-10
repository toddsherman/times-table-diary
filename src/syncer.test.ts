import { describe, expect, it } from 'vitest'
import { createProgress, withSettings } from './engine/progress'
import { mergeProgress } from './engine/sync'
import type { Progress } from './engine/types'
import type { CloudLink } from './storage'
import { createSyncer, type SyncStatus } from './syncer'

/** A device and a server whose replies wait until the test lets them through. */
function setup() {
  const device: { progress: Progress | null; link: CloudLink | null; shown: Progress | null; practicing: boolean } = {
    progress: createProgress('Ava', 20_000),
    link: { id: 'a'.repeat(64), version: 1, syncedAt: 0 },
    shown: null,
    practicing: false,
  }
  let server = structuredClone(device.progress!)
  let status: SyncStatus = { state: 'saved' }
  const waiting: Array<() => void> = []
  const calls = { sync: 0, fetch: 0 }
  const syncNow = createSyncer({
    loadLink: () => device.link && { ...device.link },
    loadProgress: () => device.progress && structuredClone(device.progress),
    flushAnswers: async () => {},
    syncDiary: async (local, link) => {
      calls.sync += 1
      await new Promise<void>((go) => waiting.push(go))
      server = mergeProgress(local, server)
      return { progress: structuredClone(server), link: { ...link, version: link.version + 1, syncedAt: 5 } }
    },
    fetchDiary: async (link) => {
      calls.fetch += 1
      return { progress: structuredClone(server), link: { ...link, syncedAt: 5 } }
    },
    saveLink: (l) => (device.link = l),
    applyProgress: (p) => {
      device.progress = p
      device.shown = p
    },
    holdsDiary: () => device.practicing,
    onStatus: (update) => (status = update(status)),
  })
  /** Lets the server's waiting reply through, and everything that follows from it. */
  const reply = async () => {
    for (let i = 0; i < 5 && waiting.length === 0; i++) await Promise.resolve()
    waiting.shift()?.()
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
  return { device, syncNow, reply, calls, status: () => status, server: () => server, setServer: (p: Progress) => (server = p) }
}

describe('the sync loop', () => {
  it('keeps a change made while a sync was on its way, and uploads it next', async () => {
    const t = setup()
    t.device.progress = withSettings(t.device.progress!, { sound: false }, 1000)
    const done = t.syncNow()
    await Promise.resolve()
    // A second change lands while the first sync waits on the network.
    t.device.progress = withSettings(t.device.progress, { dailyMinutes: 10 }, 2000)
    void t.syncNow()
    await t.reply()
    expect(t.device.progress.settings).toMatchObject({ sound: false, dailyMinutes: 10 })
    await t.reply()
    await done
    expect(t.calls.sync).toBe(2)
    expect(t.device.progress.settings).toMatchObject({ sound: false, dailyMinutes: 10 })
    expect(t.server().settings).toMatchObject({ sound: false, dailyMinutes: 10 })
    expect(t.status().state).toBe('saved')
  })

  it("doesn't bring back a diary that was forgotten mid-sync", async () => {
    const t = setup()
    const done = t.syncNow()
    await Promise.resolve()
    t.device.progress = null
    t.device.link = null
    await t.reply()
    await done
    expect(t.device.progress).toBeNull()
    expect(t.device.link).toBeNull()
    expect(t.device.shown).toBeNull()
  })

  it('leaves the diary to the practice screen mid-session', async () => {
    const t = setup()
    t.setServer(withSettings(t.server(), { sound: false }, 1000))
    t.device.practicing = true
    const done = t.syncNow()
    await t.reply()
    await done
    expect(t.device.shown).toBeNull()
    expect(t.device.link?.version).toBe(2)
    expect(t.calls.sync).toBe(1)
  })

  it("applies the server's changes when nothing changed here", async () => {
    const t = setup()
    t.setServer(withSettings(t.server(), { sound: false }, 1000))
    const done = t.syncNow()
    await t.reply()
    await done
    expect(t.device.shown?.settings.sound).toBe(false)
  })

  it("brings the diary back from the server when this device's copy is lost", async () => {
    const t = setup()
    t.device.progress = null
    await t.syncNow()
    expect(t.calls.fetch).toBe(1)
    expect(t.device.shown?.name).toBe('Ava')
    expect(t.status()).toEqual({ state: 'saved', at: 5 })
  })
})
