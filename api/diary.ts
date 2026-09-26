import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

/**
 * Diary storage API.
 *
 *   POST   /api/diary                  { action: 'create' | 'open', name, pin, progress? }
 *   GET    /api/diary?id=              → { progress, version, updatedAt }
 *   PUT    /api/diary?id=              { version, progress } (409 if another device saved first)
 *   DELETE /api/diary?id=
 *   GET    /api/diary?id=&op=answers   → { answers }
 *   POST   /api/diary?id=&op=answers   { answers }
 *
 * A diary's ID is an HMAC of her name and the family PIN with a server secret, so IDs can't be
 * guessed or reversed, and two kids with the same name get separate diaries unless they also
 * pick the same PIN.
 *
 * The app calls it as www.todd.sh/timesTableDiary/App/api/diary; a todd.sh route handler
 * forwards those requests here.
 */

export interface DiaryRecord {
  progress: unknown
  version: number
  updatedAt: number
}

export interface Store {
  get(id: string): Promise<DiaryRecord | null>
  /** Creates the diary unless one already exists. */
  create(id: string, progress: string, now: number): Promise<boolean>
  /** Saves if the stored version is still `base`; returns the new version, or null if another device saved first. */
  save(id: string, progress: string, base: number, now: number): Promise<number | null>
  remove(id: string): Promise<void>
  appendAnswers(id: string, answers: unknown[]): Promise<void>
  readAnswers(id: string): Promise<unknown[]>
  /** Counts an attempt against `key`; false once more than `limit` happen within the window. */
  hit(key: string, limit: number, windowSeconds: number): Promise<boolean>
}

const DIARY_ID = /^[0-9a-f]{64}$/
const FACT_ID = /^\d{1,2}x\d{1,2}$/
const MAX_BODY = 512 * 1024
const MAX_ANSWERS = 50_000

// Popular PINs that aren't simple patterns (patterns and years are caught in pinProblem).
const EASY_PINS = new Set(['1004', '0007', '1122', '1221', '1313', '1357', '2468', '2580', '0852', '4545', '5683', '6969', '8520'])

export function normalizeName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function pinProblem(pin: string): 'bad_pin' | 'easy_pin' | null {
  if (!/^\d{4,8}$/.test(pin)) return 'bad_pin'
  const digits = [...pin].map(Number)
  const steps = new Set(digits.slice(1).map((d, i) => (d - digits[i] + 10) % 10))
  const sequence = steps.size === 1 && (steps.has(1) || steps.has(9))
  const repeated = /^(\d{1,4})\1+$/.test(pin)
  const year = pin.length === 4 && Number(pin) >= 1950 && Number(pin) <= 2035
  return sequence || repeated || year || EASY_PINS.has(pin) ? 'easy_pin' : null
}

export function diaryId(secret: string, name: string, pin: string): string {
  return createHmac('sha256', secret).update(`${normalizeName(name)}\n${pin}`).digest('hex')
}

type Json = Record<string, unknown>

const reply = (body: Json, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const fail = (status: number, error: string) => reply({ error }, status)

function isProgress(value: unknown): boolean {
  const p = value as { version?: unknown; facts?: unknown } | null
  return typeof p === 'object' && p !== null && p.version === 1 && typeof p.facts === 'object' && p.facts !== null
}

function isAnswer(value: unknown): boolean {
  const a = value as { at?: unknown; fact?: unknown } | null
  return typeof a === 'object' && a !== null && typeof a.at === 'number' && typeof a.fact === 'string' && FACT_ID.test(a.fact)
}

async function readJson(request: Request): Promise<Json | null> {
  const text = await request.text()
  if (text.length > MAX_BODY) return null
  try {
    const value: unknown = JSON.parse(text)
    return typeof value === 'object' && value !== null ? (value as Json) : null
  } catch {
    return null
  }
}

function sameSecret(given: string | null, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return given !== null && timingSafeEqual(digest(given), digest(expected))
}

/**
 * Who's asking, for the login rate limits. Requests from www.todd.sh arrive from todd.sh's route
 * handler, so it passes the visitor's address along, and it's believed only with the proxy key.
 */
function clientIp(request: Request, proxyKey: string | undefined): string {
  const visitor = request.headers.get('x-diary-client-ip')
  if (visitor && proxyKey && sameSecret(request.headers.get('x-diary-proxy-key'), proxyKey)) return visitor
  return request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export function createHandler(
  getStore: () => Store,
  getSecret: () => string | undefined,
  getProxyKey: () => string | undefined = () => undefined,
) {
  async function login(request: Request): Promise<Response> {
    const body = await readJson(request)
    if (!body || (body.action !== 'create' && body.action !== 'open')) return fail(400, 'bad_request')
    const name = normalizeName(String(body.name ?? ''))
    const pin = String(body.pin ?? '')
    if (!name || name.length > 40) return fail(400, 'bad_name')
    const problem = pinProblem(pin)
    if (problem === 'bad_pin') return fail(400, 'bad_pin')
    if (body.action === 'create') {
      if (problem === 'easy_pin') return fail(400, 'easy_pin')
      if (!isProgress(body.progress)) return fail(400, 'bad_request')
    }

    const secret = getSecret()
    if (!secret) throw new Error('DIARY_SECRET is not set')
    const store = getStore()
    // Slow down PIN guessing, both per device and per name.
    const nameKey = createHash('sha256').update(name).digest('hex').slice(0, 24)
    const allowed =
      (await store.hit(`limit:ip:${clientIp(request, getProxyKey())}`, 20, 15 * 60)) && (await store.hit(`limit:name:${nameKey}`, 40, 60 * 60))
    if (!allowed) return fail(429, 'too_many')

    const id = diaryId(secret, name, pin)
    if (body.action === 'open') {
      const record = await store.get(id)
      return record ? reply({ id, version: record.version, progress: record.progress }) : fail(404, 'not_found')
    }
    const created = await store.create(id, JSON.stringify(body.progress), Date.now())
    return created ? reply({ id, version: 1 }, 201) : fail(409, 'taken')
  }

  return async function handle(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (!id) return request.method === 'POST' ? await login(request) : fail(400, 'bad_request')
      if (!DIARY_ID.test(id)) return fail(400, 'bad_request')
      const store = getStore()

      if (url.searchParams.get('op') === 'answers') {
        if (request.method === 'GET') return reply({ answers: await store.readAnswers(id) })
        if (request.method !== 'POST') return fail(405, 'bad_request')
        const body = await readJson(request)
        const answers = Array.isArray(body?.answers) ? (body.answers as unknown[]) : null
        if (!answers || answers.length > 500 || !answers.every(isAnswer)) return fail(400, 'bad_request')
        if (!(await store.get(id))) return fail(404, 'not_found')
        if (answers.length > 0) await store.appendAnswers(id, answers)
        return reply({ ok: true, count: answers.length })
      }

      switch (request.method) {
        case 'GET': {
          const record = await store.get(id)
          return record ? reply({ ...record }) : fail(404, 'not_found')
        }
        case 'PUT': {
          const body = await readJson(request)
          const base = Number(body?.version)
          if (!body || !Number.isInteger(base) || !isProgress(body.progress)) return fail(400, 'bad_request')
          if (!(await store.get(id))) return fail(404, 'not_found')
          const version = await store.save(id, JSON.stringify(body.progress), base, Date.now())
          if (version !== null) return reply({ version })
          const current = await store.get(id)
          return reply({ error: 'conflict', version: current?.version, progress: current?.progress }, 409)
        }
        case 'DELETE':
          await store.remove(id)
          return reply({ ok: true })
        default:
          return fail(405, 'bad_request')
      }
    } catch (err) {
      console.error(err)
      return fail(500, 'server')
    }
  }
}

/** Postgres (Neon) storage. Tables are created on first use. */
function postgresStore(): Store {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)

  let ready: Promise<void> | undefined
  const schema = async () => {
    await sql`CREATE TABLE IF NOT EXISTS diaries (
      id text PRIMARY KEY,
      progress jsonb NOT NULL,
      version integer NOT NULL,
      updated_at bigint NOT NULL,
      created_at bigint NOT NULL)`
    await sql`CREATE TABLE IF NOT EXISTS answers (
      seq bigserial PRIMARY KEY,
      diary_id text NOT NULL REFERENCES diaries (id) ON DELETE CASCADE,
      answer jsonb NOT NULL)`
    await sql`CREATE INDEX IF NOT EXISTS answers_by_diary ON answers (diary_id, seq)`
    await sql`CREATE TABLE IF NOT EXISTS attempts (key text PRIMARY KEY, count integer NOT NULL, expires_at bigint NOT NULL)`
  }
  const db = async () => {
    ready ??= schema().catch((err: unknown) => {
      ready = undefined
      throw err
    })
    await ready
    return sql
  }

  return {
    async get(id) {
      const [row] = await (await db())`SELECT progress, version, updated_at FROM diaries WHERE id = ${id}`
      return row ? { progress: row.progress, version: Number(row.version), updatedAt: Number(row.updated_at) } : null
    },
    async create(id, progress, now) {
      const rows = await (await db())`
        INSERT INTO diaries (id, progress, version, updated_at, created_at)
        VALUES (${id}, ${progress}::jsonb, 1, ${now}, ${now})
        ON CONFLICT (id) DO NOTHING
        RETURNING id`
      return rows.length === 1
    },
    async save(id, progress, base, now) {
      // Compare-and-set in one statement: only saves if nobody else saved since `base`.
      const [row] = await (await db())`
        UPDATE diaries SET progress = ${progress}::jsonb, version = version + 1, updated_at = ${now}
        WHERE id = ${id} AND version = ${base}
        RETURNING version`
      return row ? Number(row.version) : null
    },
    async remove(id) {
      await (await db())`DELETE FROM diaries WHERE id = ${id}`
    },
    async appendAnswers(id, answers) {
      await (await db())`
        INSERT INTO answers (diary_id, answer)
        SELECT ${id}, value FROM jsonb_array_elements(${JSON.stringify(answers)}::jsonb)`
    },
    async readAnswers(id) {
      const rows = await (await db())`
        SELECT answer FROM answers WHERE diary_id = ${id} ORDER BY seq DESC LIMIT ${MAX_ANSWERS}`
      return rows.reverse().map((row) => row.answer)
    },
    async hit(key, limit, windowSeconds) {
      const now = Date.now()
      const until = now + windowSeconds * 1000
      const sql = await db()
      const [row] = await sql`
        INSERT INTO attempts (key, count, expires_at) VALUES (${key}, 1, ${until})
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN attempts.expires_at < ${now} THEN 1 ELSE attempts.count + 1 END,
          expires_at = CASE WHEN attempts.expires_at < ${now} THEN ${until} ELSE attempts.expires_at END
        RETURNING count`
      if (Math.random() < 0.01) await sql`DELETE FROM attempts WHERE expires_at < ${now}`
      return Number(row.count) <= limit
    },
  }
}

let store: Store | undefined

export default {
  fetch: createHandler(
    () => (store ??= postgresStore()),
    () => process.env.DIARY_SECRET,
    () => process.env.DIARY_PROXY_KEY,
  ),
}
