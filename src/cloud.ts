import { mergeProgress, sameProgress } from './engine/sync'
import type { AnswerRecord, Progress } from './engine/types'
import { dropQueued, loadQueue, parseProgress, type CloudLink } from './storage'

const MESSAGES: Record<string, string> = {
  bad_name: 'Write your name first!',
  bad_pin: 'The family PIN needs 4 to 8 digits.',
  easy_pin: 'That PIN is too easy to guess. Pick a different one.',
  not_found: "Couldn't find a diary with that name and PIN. Check the spelling?",
  taken: 'That name and PIN are already taken. Pick a different PIN.',
  too_many: 'Too many tries. Wait a few minutes, then try again.',
  offline: "Can't reach the internet right now.",
  server: 'Something went wrong saving online. Try again in a bit.',
}

export class CloudError extends Error {
  readonly code: string
  readonly data: Record<string, unknown>

  constructor(code: string, data: Record<string, unknown> = {}) {
    super(MESSAGES[code] ?? MESSAGES.server)
    this.code = code
    this.data = data
  }
}

async function call(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  let res: Response
  try {
    res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json' } })
  } catch {
    throw new CloudError('offline')
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new CloudError(typeof body.error === 'string' ? body.error : 'server', body)
  return body
}

const diaryUrl = (link: CloudLink, op = '') => `/api/diary?id=${link.id}${op ? `&op=${op}` : ''}`
const linkFrom = (id: unknown, version: unknown): CloudLink => ({ id: String(id), version: Number(version), syncedAt: Date.now() })

/** Starts a new online diary. Fails with "taken" if that name and PIN are already in use. */
export async function createDiary(name: string, pin: string, progress: Progress): Promise<CloudLink> {
  const body = await call('/api/diary', { method: 'POST', body: JSON.stringify({ action: 'create', name, pin, progress }) })
  return linkFrom(body.id, body.version)
}

/** Opens an existing diary on this device. */
export async function openDiary(name: string, pin: string): Promise<{ progress: Progress; link: CloudLink }> {
  const body = await call('/api/diary', { method: 'POST', body: JSON.stringify({ action: 'open', name, pin }) })
  return { progress: parseProgress(JSON.stringify(body.progress)), link: linkFrom(body.id, body.version) }
}

/** Merges this device's diary with the server's copy and uploads the result if anything is new. */
export async function syncDiary(local: Progress, link: CloudLink): Promise<{ progress: Progress; link: CloudLink }> {
  const remote = await call(diaryUrl(link))
  let version = Number(remote.version)
  let serverCopy = parseProgress(JSON.stringify(remote.progress))
  for (let attempt = 0; attempt < 3; attempt++) {
    const merged = mergeProgress(local, serverCopy)
    if (sameProgress(merged, serverCopy)) return { progress: merged, link: linkFrom(link.id, version) }
    try {
      const saved = await call(diaryUrl(link), { method: 'PUT', body: JSON.stringify({ version, progress: merged }) })
      return { progress: merged, link: linkFrom(link.id, saved.version) }
    } catch (err) {
      if (!(err instanceof CloudError) || err.code !== 'conflict') throw err
      // Another device saved in between: merge with its copy and try again.
      version = Number(err.data.version)
      serverCopy = parseProgress(JSON.stringify(err.data.progress))
    }
  }
  throw new CloudError('server')
}

/** Uploads answers logged on this device. With `closing`, sends one small batch that survives the page closing. */
export async function flushAnswers(link: CloudLink, closing = false): Promise<void> {
  for (;;) {
    const batch = loadQueue().slice(0, closing ? 150 : 500)
    if (batch.length === 0) return
    await call(diaryUrl(link, 'answers'), { method: 'POST', body: JSON.stringify({ answers: batch }), keepalive: closing })
    dropQueued(batch.length)
    if (closing) return
  }
}

export async function fetchAnswers(link: CloudLink): Promise<AnswerRecord[]> {
  const body = await call(diaryUrl(link, 'answers'))
  return Array.isArray(body.answers) ? (body.answers as AnswerRecord[]) : []
}

/** Best-effort save while the app is being closed or switched away from. */
export function saveOnExit(progress: Progress, link: CloudLink): void {
  flushAnswers(link, true).catch(() => {})
  // A stale version just gets a 409; the next full sync merges properly.
  fetch(diaryUrl(link), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: link.version, progress }),
    keepalive: true,
  }).catch(() => {})
}

export async function deleteDiary(link: CloudLink): Promise<void> {
  await call(diaryUrl(link), { method: 'DELETE' })
}
