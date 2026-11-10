import { memoryAuthDb } from './memory-auth'
import { testUtils, type TestHelpers } from 'better-auth/plugins'
import { Pool } from 'pg'
import { afterAll, describe, expect, it } from 'vitest'
import { createAuthHandler } from '../api/auth'
import { createHandler, diaryId, normalizeName, pinProblem, postgresStore, type Sql, type Store } from '../api/diary'
import { accountsFrom, type Accounts } from '../server/accounts'
import { createAuth, DEVICE_CLIENT_ID, OFFER_PREFIX, type AuthEnv } from '../server/auth'
import { AUTH_SCHEMA } from '../server/auth-schema'
import { createProgress } from '../src/engine/progress'

function memoryStore(): Store {
  const diaries = new Map<string, { progress: string; version: number; updatedAt: number }>()
  const owners = new Map<string, string[]>()
  const logs = new Map<string, unknown[]>()
  const counts = new Map<string, number>()
  return {
    async get(id) {
      const d = diaries.get(id)
      return d ? { progress: JSON.parse(d.progress), version: d.version, updatedAt: d.updatedAt, owners: owners.get(id) ?? [] } : null
    },
    async create(id, progress, now, owner) {
      if (diaries.has(id)) return false
      diaries.set(id, { progress, version: 1, updatedAt: now })
      if (owner) owners.set(id, [owner])
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
      owners.delete(id)
      logs.delete(id)
    },
    async addOwner(id, userId) {
      const current = owners.get(id) ?? []
      if (current.includes(userId)) return 'already'
      if (current.length > 0 || !diaries.has(id)) return 'taken'
      owners.set(id, [userId])
      return 'added'
    },
    async kids(userId) {
      return [...owners]
        .filter(([, users]) => users.includes(userId))
        .map(([id]) => ({ id, name: JSON.parse(diaries.get(id)!.progress).name as string, updatedAt: diaries.get(id)!.updatedAt }))
    },
    async appendAnswers(id, answers) {
      const log = [...(logs.get(id) ?? [])]
      const key = (a: unknown) => `${(a as { at: number }).at} ${(a as { fact: string }).fact}`
      const known = new Set(log.map(key))
      for (const a of answers) {
        if (known.has(key(a))) continue
        known.add(key(a))
        log.push(a)
      }
      logs.set(id, log)
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

function server(secret = 'test-secret', proxyKey?: string) {
  const store = memoryStore()
  const fetchApi = createHandler(() => store, () => secret, () => proxyKey)
  return async (method: string, path: string, body?: unknown, ip = '10.0.0.1', headers: Record<string, string> = {}) => {
    const res = await fetchApi(
      new Request(`https://diary.test${path}`, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: { 'x-real-ip': ip, ...headers },
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

  it('rate-limits each visitor separately behind the todd.sh proxy', async () => {
    const api = server('test-secret', 'proxy-key')
    const open = (visitor: string) =>
      api('POST', '/api/diary', { action: 'open', name: 'Ava', pin: '8305' }, '10.9.9.9', {
        'x-diary-client-ip': visitor,
        'x-diary-proxy-key': 'proxy-key',
      })
    for (let i = 0; i < 20; i++) expect((await open('203.0.113.1')).status).toBe(404)
    expect((await open('203.0.113.1')).status).toBe(429)
    expect((await open('203.0.113.2')).status).toBe(404)
  })

  it('ignores forwarded visitor addresses without the proxy key', async () => {
    for (const api of [server('test-secret', 'proxy-key'), server()]) {
      const statuses = []
      for (let i = 0; i < 21; i++) {
        const headers = { 'x-diary-client-ip': `203.0.113.${i}`, 'x-diary-proxy-key': 'guessed-key' }
        statuses.push((await api('POST', '/api/diary', { action: 'open', name: 'Ava', pin: '8305' }, '10.9.9.9', headers)).status)
      }
      expect(statuses[20]).toBe(429)
    }
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

const SITE = 'https://www.todd.sh'
const AUTH_ENV: AuthEnv = { BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-for-better-auth' }

/** A reply's status and body, to compare whole. */
const only = ({ status, body }: { status: number; body: Record<string, unknown> }) => ({ status, body })

interface As {
  cookie?: string
  bearer?: string
  origin?: string
}

const pgUrl = process.env.TEST_DATABASE_URL
let pool: Pool | undefined
afterAll(async () => {
  await pool?.end()
})

/**
 * Postgres from TEST_DATABASE_URL, emptied, in a schema of its own so test/auth.test.ts can use
 * the same database at the same time. The store is the API's own, with pg in place of Neon.
 */
async function freshPostgres(): Promise<{ store: Store; database: Pool }> {
  if (!pool) {
    pool = new Pool({ connectionString: pgUrl, max: 2 })
    pool.on('connect', (client) => void client.query('SET search_path TO api_test'))
  }
  await pool.query('DROP SCHEMA IF EXISTS api_test CASCADE')
  await pool.query('CREATE SCHEMA api_test')
  for (const statement of AUTH_SCHEMA) await pool.query(statement)
  const database = pool
  const sql: Sql = async (strings, ...values) => (await database.query(strings.reduce((text, part, i) => text + '$' + i + part), values)).rows
  return { store: postgresStore(sql), database }
}

type Db = 'memory' | 'postgres'
const DATABASES: Db[] = pgUrl ? ['memory', 'postgres'] : ['memory']

/** A diary API and real Better Auth, with grown-ups and iPads to call them as. */
async function family(db: Db, options: { signInReady?: boolean } = {}) {
  const { store, database } = db === 'postgres' ? await freshPostgres() : { store: memoryStore(), database: memoryAuthDb() }
  const auth = createAuth(AUTH_ENV, database, [testUtils()])
  const accounts: Accounts = accountsFrom(auth)
  const diary = createHandler(
    () => store,
    () => 'test-secret',
    () => undefined,
    async () => (options.signInReady === false ? null : accounts),
    SITE,
  )
  const signIn = createAuthHandler(async () => auth, AUTH_ENV)
  const helpers = ((await auth.$context) as unknown as { test: TestHelpers }).test

  const headersFor = (as: As = {}, json = false) => {
    const headers = new Headers({ 'x-real-ip': '10.0.0.1' })
    if (json) headers.set('content-type', 'application/json')
    if (as.cookie) {
      headers.set('cookie', as.cookie)
      headers.set('origin', as.origin ?? SITE) // as the app's own pages send it
    } else if (as.origin) headers.set('origin', as.origin)
    if (as.bearer) headers.set('authorization', `Bearer ${as.bearer}`)
    return headers
  }

  const api = async (method: string, path: string, body?: unknown, as?: As) => {
    const res = await diary(
      new Request(`https://diary.test${path}`, { method, headers: headersFor(as, body !== undefined), body: body === undefined ? undefined : JSON.stringify(body) }),
    )
    return { status: res.status, body: (await res.json()) as Record<string, unknown>, setCookies: res.headers.getSetCookie() }
  }

  const signInCall = async (method: string, route: string, body?: unknown, as?: As) => {
    const res = await signIn(
      new Request(`https://times-table-diary.vercel.app/timesTableDiary/App/api/auth/${route}`, {
        method,
        headers: headersFor(as, body !== undefined),
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    )
    return { status: res.status, body: (await res.json().catch(() => null)) as Record<string, unknown> | null }
  }

  async function grownUp(email: string): Promise<As & { id: string }> {
    const user = await helpers.saveUser(helpers.createUser({ email, name: email }))
    const { headers } = await helpers.login({ userId: user.id })
    return { id: user.id, cookie: headers.get('cookie') ?? '' }
  }

  /** An iPad asking for a link code, optionally offering the diary it already has. */
  async function iPadCode(offering?: string) {
    const { body } = await signInCall('POST', 'device/code', { client_id: DEVICE_CLIENT_ID, ...(offering ? { scope: OFFER_PREFIX + offering } : {}) })
    return body as { device_code: string; user_code: string }
  }

  /** The iPad picking up its session once the code is approved. */
  async function iPadSession(code: { device_code: string }): Promise<As> {
    const { status, body } = await signInCall('POST', 'device/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: code.device_code,
      client_id: DEVICE_CLIENT_ID,
    })
    expect(status).toBe(200)
    return { bearer: String(body?.access_token) }
  }

  async function addKid(as: As, name: string): Promise<string> {
    const res = await api('POST', '/api/diary?op=kids', { progress: createProgress(name, 20_000) }, as)
    expect(res.status).toBe(201)
    return String(res.body.id)
  }

  async function linkedIPad(as: As, kid: string): Promise<As> {
    const code = await iPadCode()
    expect((await api('POST', '/api/diary?op=link', { code: code.user_code, diaryId: kid }, as)).status).toBe(200)
    return iPadSession(code)
  }

  /** Makes every session look last renewed `days` ago, so its next use renews it. */
  async function ageSessions(days: number) {
    const { adapter } = await auth.$context
    for (const session of await adapter.findMany<{ id: string }>({ model: 'session' })) {
      const expiresAt = new Date(Date.now() + (365 - days) * 86_400_000)
      await adapter.update({ model: 'session', where: [{ field: 'id', value: session.id }], update: { expiresAt, updatedAt: new Date(Date.now() - days * 86_400_000) } })
    }
  }

  async function daysLeft(): Promise<number[]> {
    const { adapter } = await auth.$context
    const sessions = await adapter.findMany<{ expiresAt: Date }>({ model: 'session' })
    return sessions.map((s) => Math.round((new Date(s.expiresAt).getTime() - Date.now()) / 86_400_000))
  }

  return { api, signInCall, grownUp, iPadCode, iPadSession, addKid, linkedIPad, ageSessions, daysLeft }
}

describe.each(DATABASES)('grown-ups and their kids (%s)', (db) => {
  it("adds a kid, and only that kid's grown-up can open the diary", async () => {
    const { api, grownUp, addKid } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    expect((await api('GET', '/api/diary?op=kids', undefined, mom)).body.kids).toEqual([{ id: ava, name: 'Ava', updatedAt: expect.any(Number) }])

    expect((await api('GET', `/api/diary?id=${ava}`, undefined, mom)).status).toBe(200)
    expect(await api('PUT', `/api/diary?id=${ava}`, { version: 1, progress: createProgress('Ava', 20_001) }, mom)).toMatchObject({ status: 200, body: { version: 2 } })

    // The bare ID no longer opens it.
    expect(only(await api('GET', `/api/diary?id=${ava}`))).toEqual({ status: 401, body: { error: 'link_needed' } })
    const stranger = await grownUp('stranger@example.com')
    expect((await api('GET', `/api/diary?id=${ava}`, undefined, stranger)).body.error).toBe('not_yours')
    expect((await api('GET', `/api/diary?id=${ava}&op=answers`, undefined, stranger)).body.error).toBe('not_yours')
    expect((await api('DELETE', `/api/diary?id=${ava}`, undefined, stranger)).body.error).toBe('not_yours')
    expect((await api('GET', '/api/diary?op=kids', undefined, stranger)).body.kids).toEqual([])
  })

  it('makes changes with a grown-up\'s cookie only from the app\'s own pages', async () => {
    const { api, grownUp, addKid } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    const elsewhere = { ...mom, origin: 'https://evil.example' }
    expect((await api('POST', '/api/diary?op=kids', { progress: createProgress('Zed', 20_000) }, elsewhere)).body.error).toBe('bad_origin')
    expect((await api('DELETE', `/api/diary?id=${ava}`, undefined, elsewhere)).body.error).toBe('bad_origin')
    expect((await api('GET', `/api/diary?id=${ava}`, undefined, mom)).status).toBe(200)
  })

  it('adds a diary made with a name and PIN, after which the name and PIN stop opening it', async () => {
    const { api, grownUp } = await family(db)
    const made = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    const mom = await grownUp('mom@example.com')

    expect((await api('POST', '/api/diary?op=attach', { name: 'Ava', pin: '8306' }, mom)).status).toBe(404)
    expect(only(await api('POST', '/api/diary?op=attach', { name: ' ava ', pin: '8305' }, mom))).toEqual({ status: 200, body: { id: made.body.id, name: 'Ava' } })
    expect((await api('POST', '/api/diary?op=attach', { name: 'Ava', pin: '8305' }, mom)).status).toBe(200)
    expect((await api('GET', '/api/diary?op=kids', undefined, mom)).body.kids).toHaveLength(1)

    const dad = await grownUp('dad@example.com')
    expect((await api('POST', '/api/diary?op=attach', { name: 'Ava', pin: '8305' }, dad)).body.error).toBe('has_grown_up')
    expect((await api('POST', '/api/diary', { action: 'open', name: 'Ava', pin: '8305' })).body.error).toBe('has_grown_up')
    expect((await api('GET', `/api/diary?id=${made.body.id}`)).body.error).toBe('link_needed')
  })

  it("leaves diaries without a grown-up as they were, and answers 'not ready' before sign-in is set up", async () => {
    const { api } = await family(db, { signInReady: false })
    const made = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    expect((await api('GET', `/api/diary?id=${made.body.id}`)).status).toBe(200)
    expect(only(await api('GET', '/api/diary?op=kids'))).toEqual({ status: 503, body: { error: 'not_ready' } })
  })
})

describe.each(DATABASES)('linked iPads (%s)', (db) => {
  it("opens and saves its own kid's diary, and nothing else", async () => {
    const { api, grownUp, addKid, linkedIPad } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    const ben = await addKid(mom, 'Ben')
    const avasIPad = await linkedIPad(mom, ava)

    const mine = await api('GET', '/api/diary?op=mine', undefined, avasIPad)
    expect(mine.body).toMatchObject({ id: ava, version: 1, progress: { name: 'Ava' } })
    expect((await api('PUT', `/api/diary?id=${ava}`, { version: 1, progress: createProgress('Ava', 20_001) }, avasIPad)).status).toBe(200)
    expect((await api('POST', `/api/diary?id=${ava}&op=answers`, { answers: [answer(1)] }, avasIPad)).body.count).toBe(1)
    expect((await api('GET', `/api/diary?id=${ava}&op=answers`, undefined, avasIPad)).body.answers).toHaveLength(1)

    expect((await api('GET', `/api/diary?id=${ben}`, undefined, avasIPad)).body.error).toBe('not_yours')
    expect((await api('DELETE', `/api/diary?id=${ava}`, undefined, avasIPad)).body.error).toBe('grown_up_only')
    for (const [method, op] of [['GET', 'kids'], ['POST', 'kids'], ['GET', 'devices'], ['POST', 'link']]) {
      const body = method === 'POST' ? { progress: createProgress('Zed', 20_000) } : undefined
      expect((await api(method, `/api/diary?op=${op}`, body, avasIPad)).body.error, `${method} ${op}`).toBe('grown_up_only')
    }
  })

  it("brings an iPad's own name-and-PIN diary into the grown-up's account when they approve it", async () => {
    const { api, grownUp, iPadCode, iPadSession } = await family(db)
    const made = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    const id = String(made.body.id)
    const mom = await grownUp('mom@example.com')

    const code = await iPadCode(id)
    expect((await api('GET', `/api/diary?op=link&code=${code.user_code}`, undefined, mom)).body).toEqual({ offered: { name: 'Ava', status: 'free' } })
    expect((await api('POST', '/api/diary?op=link', { code: code.user_code }, mom)).body).toEqual({ diaryId: id })
    const iPad = await iPadSession(code)

    expect((await api('GET', '/api/diary?op=mine', undefined, iPad)).body.id).toBe(id)
    expect((await api('GET', `/api/diary?id=${id}`, undefined, iPad)).status).toBe(200)
    expect((await api('GET', '/api/diary?op=kids', undefined, mom)).body.kids).toMatchObject([{ id, name: 'Ava' }])
    expect((await api('GET', `/api/diary?id=${id}`)).body.error).toBe('link_needed')
  })

  it("won't approve a code for another family's diary, or a code another grown-up already has", async () => {
    const { api, grownUp, addKid, iPadCode } = await family(db)
    const mom = await grownUp('mom@example.com')
    const other = await grownUp('other@example.com')
    const ava = await addKid(mom, 'Ava')

    // An iPad offering a diary that's already someone else's.
    const offering = await iPadCode(ava)
    expect((await api('GET', `/api/diary?op=link&code=${offering.user_code}`, undefined, other)).body).toEqual({ offered: { name: 'Ava', status: 'taken' } })
    expect((await api('POST', '/api/diary?op=link', { code: offering.user_code }, other)).body.error).toBe('has_grown_up')
    expect((await api('POST', '/api/diary?op=link', { code: offering.user_code, diaryId: ava }, other)).body.error).toBe('has_grown_up')

    // Once one grown-up has looked at a code, it's theirs to approve.
    const code = await iPadCode()
    expect((await api('POST', '/api/diary?op=link', { code: code.user_code, diaryId: ava }, other)).body.error).toBe('not_yours')
    expect((await api('POST', '/api/diary?op=link', { code: code.user_code, diaryId: ava }, mom)).body.error).toBe('bad_code')
    expect((await api('GET', `/api/diary?op=link&code=${code.user_code}`, undefined, mom)).body.error).toBe('bad_code')
    expect((await api('GET', '/api/diary?op=link&code=NOPE1234', undefined, mom)).body.error).toBe('bad_code')
  })

  it('takes a code typed in lowercase with a dash', async () => {
    const { api, grownUp, addKid, iPadCode, iPadSession } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    const code = await iPadCode()
    const typed = `${code.user_code.slice(0, 4)}-${code.user_code.slice(4)}`.toLowerCase()
    expect((await api('POST', '/api/diary?op=link', { code: typed, diaryId: ava }, mom)).status).toBe(200)
    expect((await api('GET', '/api/diary?op=mine', undefined, await iPadSession(code))).body.id).toBe(ava)
  })

  it('lists the linked iPads, and unlinking one ends its session', async () => {
    const { api, grownUp, addKid, linkedIPad } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    const iPad = await linkedIPad(mom, ava)

    const { devices } = (await api('GET', '/api/diary?op=devices', undefined, mom)).body as { devices: Array<{ id: string }> }
    expect(devices).toEqual([{ id: expect.any(String), diaryId: ava, name: 'Ava', linkedAt: expect.any(Number), lastSeen: expect.any(Number) }])

    const other = await grownUp('other@example.com')
    expect((await api('DELETE', `/api/diary?op=devices&device=${devices[0].id}`, undefined, other)).status).toBe(404)
    expect((await api('DELETE', `/api/diary?op=devices&device=${devices[0].id}`, undefined, mom)).status).toBe(200)
    expect((await api('GET', `/api/diary?id=${ava}`, undefined, iPad)).body.error).toBe('link_needed')
    expect((await api('GET', '/api/diary?op=devices', undefined, mom)).body.devices).toEqual([])
  })

  it("ends a kid's iPad sessions when their diary is deleted", async () => {
    const { api, grownUp, addKid, linkedIPad } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    const iPad = await linkedIPad(mom, ava)
    expect((await api('DELETE', `/api/diary?id=${ava}`, undefined, mom)).status).toBe(200)
    expect((await api('GET', '/api/diary?op=mine', undefined, iPad)).body.error).toBe('link_needed')
    expect((await api('GET', '/api/diary?op=kids', undefined, mom)).body.kids).toEqual([])
  })

  it("renews sessions as they're used, sending a cookie back to a grown-up but never to an iPad", async () => {
    const { api, grownUp, addKid, linkedIPad, ageSessions, daysLeft } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    const iPad = await linkedIPad(mom, ava)
    await ageSessions(2)
    expect(await daysLeft()).toEqual([363, 363])

    const fromIPad = await api('GET', `/api/diary?id=${ava}`, undefined, iPad)
    expect(fromIPad.status).toBe(200)
    expect(fromIPad.setCookies).toEqual([])
    expect((await daysLeft()).sort()).toEqual([363, 365])

    const fromMom = await api('GET', '/api/diary?op=kids', undefined, mom)
    expect(fromMom.setCookies.some((c) => c.includes('session_token='))).toBe(true)
    expect(await daysLeft()).toEqual([365, 365])
  })

  it('keeps an iPad out of sign-in settings, and an iPad linked without a kid out of every diary', async () => {
    const { api, signInCall, grownUp, addKid, linkedIPad, iPadCode, iPadSession } = await family(db)
    const mom = await grownUp('mom@example.com')
    const ava = await addKid(mom, 'Ava')
    const iPad = await linkedIPad(mom, ava)

    expect((await signInCall('GET', 'get-session', undefined, iPad)).body?.user).toMatchObject({ id: mom.id })
    expect((await signInCall('GET', 'list-sessions', undefined, iPad)).status).toBe(403)
    expect((await signInCall('POST', 'link-social', { provider: 'google' }, { ...iPad, origin: SITE })).status).toBe(403)
    const another = await iPadCode()
    expect((await signInCall('GET', `device?user_code=${another.user_code}`, undefined, iPad)).status).toBe(403)

    // Nobody can make their own session pass for an iPad's, or tie it to a diary.
    const tried = await signInCall('POST', 'update-session', { linkedDevice: true, diaryId: ava }, mom)
    expect(tried.status).not.toBe(200)
    expect((await api('GET', '/api/diary?op=kids', undefined, mom)).status).toBe(200)

    // Approved through sign-in's own approval, the iPad's session has no kid's diary.
    expect((await signInCall('GET', `device?user_code=${another.user_code}`, undefined, mom)).status).toBe(200)
    expect((await signInCall('POST', 'device/approve', { userCode: another.user_code }, mom)).status).toBe(200)
    const unassigned = await iPadSession(another)
    expect((await api('GET', `/api/diary?id=${ava}`, undefined, unassigned)).body.error).toBe('not_yours')
    expect((await api('GET', '/api/diary?op=mine', undefined, unassigned)).body.error).toBe('no_diary')
  })

  it('stores an answer once, however many times it is sent', async () => {
    const { api } = await family(db)
    const made = await api('POST', '/api/diary', { action: 'create', name: 'Ava', pin: '8305', progress })
    const path = `/api/diary?id=${String(made.body.id)}&op=answers`
    await api('POST', path, { answers: [answer(1), answer(2)] })
    // The same batch again (its reply got lost), overlapping a newer one, with a repeat inside it.
    await api('POST', path, { answers: [answer(1), answer(2)] })
    await api('POST', path, { answers: [answer(2), answer(3), answer(3), { ...answer(3), fact: '6x7' }] })
    const log = (await api('GET', path)).body.answers as Array<{ at: number; fact: string }>
    expect(log.map((a) => `${a.at} ${a.fact}`)).toEqual(['1 7x8', '2 7x8', '3 7x8', '3 6x7'])
  })

  it('stops someone guessing link codes', async () => {
    const { api, grownUp, iPadCode } = await family(db)
    const guesser = await grownUp('guesser@example.com')
    for (let i = 0; i < 30; i++) {
      expect((await api('GET', `/api/diary?op=link&code=WRONG${i}`, undefined, guesser)).body.error).toBe('bad_code')
    }
    // Out of tries: even a real code is refused now, to look at or to approve.
    const code = await iPadCode()
    expect(only(await api('GET', `/api/diary?op=link&code=${code.user_code}`, undefined, guesser))).toEqual({ status: 429, body: { error: 'too_many' } })
    expect((await api('POST', '/api/diary?op=link', { code: code.user_code, diaryId: 'a'.repeat(64) }, guesser)).status).toBe(429)
  })
})
