import { describe, expect, it } from 'vitest'
import { createHandler, diaryId, normalizeName, pinProblem, type Store } from '../api/diary'
import { createProgress } from '../src/engine/progress'

function memoryStore(): Store {
  const diaries = new Map<string, { progress: string; version: number; updatedAt: number }>()
  const logs = new Map<string, unknown[]>()
  const counts = new Map<string, number>()
  return {
    async get(id) {
      const d = diaries.get(id)
      return d ? { progress: JSON.parse(d.progress), version: d.version, updatedAt: d.updatedAt } : null
    },
    async create(id, progress, now) {
      if (diaries.has(id)) return false
      diaries.set(id, { progress, version: 1, updatedAt: now })
      return true
    },
    async save(id, progress, base, now) {
      const d = diaries.get(id)
      if (!d || d.version !== base) return null
      diaries.set(id, { progress, version: base + 1, updatedAt: now })
      return base + 1
    },
    async remove(id) {
      diaries.delete(id)
      logs.delete(id)
    },
    async appendAnswers(id, answers) {
      logs.set(id, [...(logs.get(id) ?? []), ...answers])
    },
    async readAnswers(id) {
      return logs.get(id) ?? []
    },
    async hit(key, limit) {
      const n = (counts.get(key) ?? 0) + 1
      counts.set(key, n)
      return n <= limit
    },
  }
}

function server(secret = 'test-secret') {
  const store = memoryStore()
  const fetchApi = createHandler(() => store, () => secret)
  return async (method: string, path: string, body?: unknown, ip = '10.0.0.1') => {
    const res = await fetchApi(
      new Request(`https://diary.test${path}`, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: { 'x-real-ip': ip },
      }),
    )
    return { status: res.status, body: (await res.json()) as Record<string, unknown> }
  }
}

const progress = createProgress('Ava', 20_000)
const answer = (at: number) => ({ at, day: 20_000, fact: '7x8', given: 56, correct: true, ms: 1800, kind: 'review', outcome: 'fast', before: 4, after: 5 })

describe('family PINs', () => {
  it('needs 4 to 8 digits', () => {
    for (const pin of ['', '123', '123456789', '12a4']) expect(pinProblem(pin), pin).toBe('bad_pin')
  })

  it('turns away PINs that are easy to guess', () => {
    for (const pin of ['1234', '4321', '0000', '1212', '123123', '12341234', '2016', '6969', '7890']) {
      expect(pinProblem(pin), pin).toBe('easy_pin')
    }
  })

  it('accepts ordinary PINs', () => {
    for (const pin of ['8305', '4729', '482916', '30571846']) expect(pinProblem(pin), pin).toBeNull()
  })

  it('ignores capitals, accents and spacing in names', () => {
    expect(normalizeName('  Zoë ')).toBe('zoe')
    expect(normalizeName('Mary-Jane')).toBe(normalizeName('mary   jane'))
    expect(diaryId('s', 'ZOË', '8305')).toBe(diaryId('s', 'zoe', '8305'))
    expect(diaryId('s', 'Zoe', '8305')).not.toBe(diaryId('s', 'Zoe', '8306'))
    expect(diaryId('s', 'Zoe', '8305')).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('diary API', () => {
  it('creates a diary and opens it again with the same name and PIN', async () => {
    const api = server()
    const created = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    expect(created.status).toBe(201)
    const opened = await api('POST', '/api/diary', { action: 'open', name: ' ava ', pin: '8305' })
    expect(opened.status).toBe(200)
    expect(opened.body.id).toBe(created.body.id)
    expect((opened.body.progress as { name: string }).name).toBe('Ava')
  })

  it("won't open with the wrong PIN, reuse a taken name and PIN, or accept an easy PIN", async () => {
    const api = server()
    await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    expect((await api('POST', '/api/diary', { action: 'open', name: 'Ava', pin: '8306' })).body.error).toBe('not_found')
    expect((await api('POST', '/api/diary', { action: 'create', name: 'AVA', pin: '8305', progress })).body.error).toBe('taken')
    expect((await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '1234', progress })).body.error).toBe('easy_pin')
    expect((await api('POST', '/api/diary', { action: 'create', name: '  ', pin: '8305', progress })).body.error).toBe('bad_name')
  })

  it('rate-limits PIN guessing from one device', async () => {
    const api = server()
    const statuses = []
    for (let pin = 5000; pin < 5021; pin++) statuses.push((await api('POST', '/api/diary', { action: 'open', name: 'Ava', pin: String(pin) })).status)
    expect(statuses.slice(0, 20).every((s) => s === 404)).toBe(true)
    expect(statuses[20]).toBe(429)
  })

  it('saves with version checks so one device never silently overwrites another', async () => {
    const api = server()
    const { body } = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    const path = `/api/diary?id=${body.id}`
    expect(await api('PUT', path, { version: 1, progress })).toMatchObject({ status: 200, body: { version: 2 } })
    const stale = await api('PUT', path, { version: 1, progress })
    expect(stale.status).toBe(409)
    expect(stale.body).toMatchObject({ error: 'conflict', version: 2 })
    expect((await api('GET', path)).body.version).toBe(2)
  })

  it('logs answers and reads them back', async () => {
    const api = server()
    const { body } = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    const path = `/api/diary?id=${body.id}&op=answers`
    expect((await api('POST', path, { answers: [answer(1), answer(2)] })).body.count).toBe(2)
    expect((await api('GET', path)).body.answers).toHaveLength(2)
    expect((await api('POST', path, { answers: [{ nope: true }] })).status).toBe(400)
    expect((await api('POST', `/api/diary?id=${'0'.repeat(64)}&op=answers`, { answers: [answer(3)] })).status).toBe(404)
  })

  it('deletes a diary for good', async () => {
    const api = server()
    const { body } = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    expect((await api('DELETE', `/api/diary?id=${body.id}`)).status).toBe(200)
    expect((await api('GET', `/api/diary?id=${body.id}`)).status).toBe(404)
  })

  it('rejects malformed IDs and fails safely without its secret', async () => {
    expect((await server()('GET', '/api/diary?id=../../etc')).status).toBe(400)
    const broken = await server('')('POST', '/api/diary', { action: 'open', name: 'Ava', pin: '8305' })
    expect(broken).toEqual({ status: 500, body: { error: 'server' } })
  })
})
