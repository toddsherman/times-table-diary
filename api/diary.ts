import { createHash, createHmac, randomBytes } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import type { Accounts, Viewer } from '../server/accounts.js'
import { clientIp } from '../server/client-ip.js'

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
 * pick the same PIN. A diary a grown-up adds gets a random ID instead.
 *
 * Grown-ups (see server/auth.ts) sign in with Google or Apple, and link a kid's iPad with a code.
 * A diary with no grown-up yet opens by its ID alone, as before. Once it has one, only that
 * grown-up's own sign-in and the iPads they linked to it can open it, and only their own sign-in
 * can delete it. The calls for that, all needing a grown-up's own sign-in unless noted:
 *
 *   GET    /api/diary?op=kids              → { kids: [{ id, name, updatedAt }] }
 *   POST   /api/diary?op=kids              { progress } → { id, version }: a new kid's diary
 *   POST   /api/diary?op=attach            { name, pin } → { id, name }: a diary made with name and PIN
 *   GET    /api/diary?op=link&code=        → { offered: { name, status } | null }: a link code, and the
 *                                            diary that iPad has (status 'free', 'yours' or 'taken')
 *   POST   /api/diary?op=link              { code, diaryId? } → { diaryId }: approve the code for that
 *                                            kid, or, without diaryId, for the diary the iPad offered
 *   GET    /api/diary?op=devices           → { devices: [{ id, diaryId, name, linkedAt, lastSeen }] }
 *   DELETE /api/diary?op=devices&device=   unlink an iPad
 *   GET    /api/diary?op=mine              → { id, version, progress, updatedAt }: a linked iPad's diary
 *                                            (the iPad's own call)
 *
 * The app calls it as www.todd.sh/timesTableDiary/App/api/diary; a todd.sh route handler
 * forwards those requests here.
 */

export interface DiaryRecord {
  progress: unknown
  version: number
  updatedAt: number
  /** The grown-ups' user IDs. Empty for a diary that so far opens by its ID alone. */
  owners: string[]
}

export interface Kid {
  id: string
  name: string
  updatedAt: number
}

export interface Store {
  get(id: string): Promise<DiaryRecord | null>
  /** Creates the diary unless one already exists, with `owner` as its grown-up if given. */
  create(id: string, progress: string, now: number, owner?: string): Promise<boolean>
  /** Saves if the stored version is still `base`; returns the new version, or null if another device saved first. */
  save(id: string, progress: string, base: number, now: number): Promise<number | null>
  remove(id: string): Promise<void>
  appendAnswers(id: string, answers: unknown[]): Promise<void>
  readAnswers(id: string): Promise<unknown[]>
  /** Counts an attempt against `key`; false once more than `limit` happen within the window. */
  hit(key: string, limit: number, windowSeconds: number): Promise<boolean>
  /** Makes `userId` the grown-up of a diary that has none: 'already' if it's theirs, 'taken' if someone else's. */
  addOwner(id: string, userId: string, now: number): Promise<'added' | 'already' | 'taken'>
  /** A grown-up's diaries, oldest first. */
  kids(userId: string): Promise<Kid[]>
}

const DIARY_ID = /^[0-9a-f]{64}$/
const MAX_NAME = 40
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

export function createHandler(
  getStore: () => Store,
  getSecret: () => string | undefined,
  getProxyKey: () => string | undefined = () => undefined,
  getAccounts: () => Promise<Accounts | null> = async () => null,
  /** The site the app's own pages come from, the only one allowed to change things with a grown-up's cookie. */
  trustedOrigin = 'https://www.todd.sh',
) {
  /** Slows down PIN guessing, both per device and per name. */
  async function underPinLimits(store: Store, request: Request, name: string): Promise<boolean> {
    const nameKey = createHash('sha256').update(name).digest('hex').slice(0, 24)
    return (await store.hit(`limit:ip:${clientIp(request, getProxyKey())}`, 20, 15 * 60)) && (await store.hit(`limit:name:${nameKey}`, 40, 60 * 60))
  }

  function readNameAndPin(body: Json | null): { name: string; pin: string; problem: ReturnType<typeof pinProblem> } | Response {
    const name = normalizeName(String(body?.name ?? ''))
    const pin = String(body?.pin ?? '')
    if (!name || name.length > MAX_NAME) return fail(400, 'bad_name')
    const problem = pinProblem(pin)
    if (problem === 'bad_pin') return fail(400, 'bad_pin')
    return { name, pin, problem }
  }

  function needSecret(): string {
    const secret = getSecret()
    if (!secret) throw new Error('DIARY_SECRET is not set')
    return secret
  }

  async function login(request: Request): Promise<Response> {
    const body = await readJson(request)
    if (!body || (body.action !== 'create' && body.action !== 'open')) return fail(400, 'bad_request')
    const given = readNameAndPin(body)
    if (given instanceof Response) return given
    if (body.action === 'create') {
      if (given.problem === 'easy_pin') return fail(400, 'easy_pin')
      if (!isProgress(body.progress)) return fail(400, 'bad_request')
    }

    const secret = needSecret()
    const store = getStore()
    if (!(await underPinLimits(store, request, given.name))) return fail(429, 'too_many')

    const id = diaryId(secret, given.name, given.pin)
    if (body.action === 'open') {
      const record = await store.get(id)
      if (!record) return fail(404, 'not_found')
      // Once a grown-up has it, a name and PIN no longer open it.
      if (record.owners.length > 0) return fail(403, 'has_grown_up')
      return reply({ id, version: record.version, progress: record.progress })
    }
    const created = await store.create(id, JSON.stringify(body.progress), Date.now())
    return created ? reply({ id, version: 1 }, 201) : fail(409, 'taken')
  }

  /** Who's asking, once per request, with any cookies Better Auth refreshed collected for the reply. */
  function asker(request: Request, setCookies: string[]) {
    let found: Promise<{ viewer: Viewer; accounts: Accounts } | Response> | undefined
    return () =>
      (found ??= (async () => {
        const accounts = await getAccounts()
        if (!accounts) return fail(503, 'not_ready')
        const { viewer, setCookies: refreshed } = await accounts.viewer(request)
        // A grown-up's renewed cookie goes back to them. An iPad keeps to its token, so it never
        // holds a cookie that would get in the way of a grown-up signing in on it.
        const bearer = request.headers.has('authorization')
        if (!bearer) setCookies.push(...refreshed)
        if (!viewer) return fail(401, 'link_needed')
        // Browsers send cookies along with requests that other sites start, too. Changes made with
        // a cookie must come from the app's own pages. (An iPad's bearer token isn't sent that way.)
        const changes = request.method !== 'GET' && request.method !== 'HEAD'
        if (changes && !bearer && request.headers.get('origin') !== trustedOrigin) return fail(403, 'bad_origin')
        return { viewer, accounts }
      })())
  }
  type Ask = ReturnType<typeof asker>

  /** Null if this request may use the diary; otherwise the reply saying why not. */
  async function refuse(record: DiaryRecord, id: string, ask: Ask, deleting: boolean): Promise<Response | null> {
    if (record.owners.length === 0) return null // No grown-up yet: its ID opens it, as before.
    const found = await ask()
    if (found instanceof Response) return found
    const { viewer } = found
    if (!record.owners.includes(viewer.userId)) return fail(403, 'not_yours')
    if (viewer.device && viewer.diaryId !== id) return fail(403, 'not_yours')
    if (viewer.device && deleting) return fail(403, 'grown_up_only')
    return null
  }

  async function diaryRoute(request: Request, url: URL, id: string, ask: Ask): Promise<Response> {
    const store = getStore()
    const record = await store.get(id)
    const deleting = request.method === 'DELETE' && url.searchParams.get('op') !== 'answers'
    const refused = record && (await refuse(record, id, ask, deleting))
    if (refused) return refused

    if (url.searchParams.get('op') === 'answers') {
      if (request.method === 'GET') return reply({ answers: await store.readAnswers(id) })
      if (request.method !== 'POST') return fail(405, 'bad_request')
      const body = await readJson(request)
      const answers = Array.isArray(body?.answers) ? (body.answers as unknown[]) : null
      if (!answers || answers.length > 500 || !answers.every(isAnswer)) return fail(400, 'bad_request')
      if (!record) return fail(404, 'not_found')
      if (answers.length > 0) await store.appendAnswers(id, answers)
      return reply({ ok: true, count: answers.length })
    }

    switch (request.method) {
      case 'GET':
        return record ? reply({ progress: record.progress, version: record.version, updatedAt: record.updatedAt }) : fail(404, 'not_found')
      case 'PUT': {
        const body = await readJson(request)
        const base = Number(body?.version)
        if (!body || !Number.isInteger(base) || !isProgress(body.progress)) return fail(400, 'bad_request')
        if (!record) return fail(404, 'not_found')
        const version = await store.save(id, JSON.stringify(body.progress), base, Date.now())
        if (version !== null) return reply({ version })
        const current = await store.get(id)
        return reply({ error: 'conflict', version: current?.version, progress: current?.progress }, 409)
      }
      case 'DELETE': {
        await store.remove(id)
        // Its iPads have nothing left to open.
        if (record && record.owners.length > 0) await (await getAccounts())?.forgetDiary(id)
        return reply({ ok: true })
      }
      default:
        return fail(405, 'bad_request')
    }
  }

  async function accountRoute(request: Request, url: URL, op: string, ask: Ask): Promise<Response> {
    const found = await ask()
    if (found instanceof Response) return found
    const { viewer, accounts } = found
    const store = getStore()
    const now = Date.now()

    if (op === 'mine' && request.method === 'GET') {
      const record = viewer.device && viewer.diaryId ? await store.get(viewer.diaryId) : null
      if (!record || !viewer.diaryId || !record.owners.includes(viewer.userId)) return fail(404, 'no_diary')
      return reply({ id: viewer.diaryId, version: record.version, progress: record.progress, updatedAt: record.updatedAt })
    }
    if (viewer.device) return fail(403, 'grown_up_only')
    const me = viewer.userId

    switch (`${request.method} ${op}`) {
      case 'GET kids':
        return reply({ kids: await store.kids(me) })

      case 'POST kids': {
        const body = await readJson(request)
        const name = normalizeName(String((body?.progress as { name?: unknown } | undefined)?.name ?? ''))
        if (!body || !isProgress(body.progress)) return fail(400, 'bad_request')
        if (!name || name.length > MAX_NAME) return fail(400, 'bad_name')
        const id = randomBytes(32).toString('hex')
        if (!(await store.create(id, JSON.stringify(body.progress), now, me))) return fail(500, 'server')
        return reply({ id, version: 1 }, 201)
      }

      case 'POST attach': {
        const given = readNameAndPin(await readJson(request))
        if (given instanceof Response) return given
        if (!(await underPinLimits(store, request, given.name))) return fail(429, 'too_many')
        const id = diaryId(needSecret(), given.name, given.pin)
        const record = await store.get(id)
        if (!record) return fail(404, 'not_found')
        if ((await store.addOwner(id, me, now)) === 'taken') return fail(409, 'has_grown_up')
        return reply({ id, name: (record.progress as { name?: unknown }).name ?? '' })
      }

      case 'GET link': {
        const code = await accounts.linkCode(url.searchParams.get('code') ?? '', me)
        if (!code) return fail(404, 'bad_code')
        const offered = code.offeredDiaryId ? await store.get(code.offeredDiaryId) : null
        if (!offered) return reply({ offered: null })
        const status = offered.owners.length === 0 ? 'free' : offered.owners.includes(me) ? 'yours' : 'taken'
        return reply({ offered: { name: (offered.progress as { name?: unknown }).name ?? '', status } })
      }

      case 'POST link': {
        const body = await readJson(request)
        const userCode = typeof body?.code === 'string' ? body.code : ''
        const code = await accounts.linkCode(userCode, me)
        if (!code) return fail(404, 'bad_code')
        // Without a diaryId, it's the diary that iPad already has, added to this grown-up's if it has none.
        const chosen = typeof body?.diaryId === 'string' ? body.diaryId : code.offeredDiaryId
        if (!chosen || !DIARY_ID.test(chosen)) return fail(400, 'bad_request')
        const record = await store.get(chosen)
        if (!record) return fail(404, 'not_found')
        if (!record.owners.includes(me)) {
          if (chosen !== code.offeredDiaryId) return fail(403, 'not_yours')
          if ((await store.addOwner(chosen, me, now)) === 'taken') return fail(409, 'has_grown_up')
        }
        if (!(await accounts.approveLink(userCode, me, chosen))) return fail(404, 'bad_code')
        return reply({ diaryId: chosen })
      }

      case 'GET devices': {
        const names = new Map((await store.kids(me)).map((kid) => [kid.id, kid.name]))
        const devices = await accounts.devices(me)
        return reply({ devices: devices.map((d) => ({ ...d, name: (d.diaryId && names.get(d.diaryId)) || null })) })
      }

      case 'DELETE devices':
        return (await accounts.removeDevice(me, url.searchParams.get('device') ?? '')) ? reply({ ok: true }) : fail(404, 'not_found')

      default:
        return fail(405, 'bad_request')
    }
  }

  return async function handle(request: Request): Promise<Response> {
    const setCookies: string[] = []
    let response: Response
    try {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      const op = url.searchParams.get('op')
      const ask = asker(request, setCookies)
      if (id) response = DIARY_ID.test(id) ? await diaryRoute(request, url, id, ask) : fail(400, 'bad_request')
      else if (op) response = await accountRoute(request, url, op, ask)
      else response = request.method === 'POST' ? await login(request) : fail(400, 'bad_request')
    } catch (err) {
      console.error(err)
      response = fail(500, 'server')
    }
    // Better Auth renews a grown-up's cookie now and then; pass that along.
    for (const cookie of setCookies) response.headers.append('Set-Cookie', cookie)
    return response
  }
}

/** Runs a query written as a tagged template, like Neon's `sql`, and returns its rows. */
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>

/** Postgres storage. Tables are created on first use. */
export function postgresStore(sql: Sql): Store {

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
    // A diary's grown-ups: user IDs from Better Auth's auth_user (see server/auth.ts).
    await sql`CREATE TABLE IF NOT EXISTS diary_access (
      diary_id text NOT NULL REFERENCES diaries (id) ON DELETE CASCADE,
      user_id text NOT NULL,
      added_at bigint NOT NULL,
      PRIMARY KEY (diary_id, user_id))`
    await sql`CREATE INDEX IF NOT EXISTS diary_access_by_user ON diary_access (user_id, added_at)`
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
      const [row] = await (await db())`
        SELECT progress, version, updated_at,
          ARRAY(SELECT user_id FROM diary_access WHERE diary_id = diaries.id ORDER BY added_at) AS owners
        FROM diaries WHERE id = ${id}`
      return row ? { progress: row.progress, version: Number(row.version), updatedAt: Number(row.updated_at), owners: row.owners as string[] } : null
    },
    async create(id, progress, now, owner) {
      // One statement, so a grown-up's new diary never exists without them.
      const rows = await (await db())`
        WITH made AS (
          INSERT INTO diaries (id, progress, version, updated_at, created_at)
          VALUES (${id}, ${progress}::jsonb, 1, ${now}, ${now})
          ON CONFLICT (id) DO NOTHING
          RETURNING id),
        access AS (
          INSERT INTO diary_access (diary_id, user_id, added_at)
          SELECT id, ${owner ?? null}::text, ${now} FROM made WHERE ${owner ?? null}::text IS NOT NULL)
        SELECT id FROM made`
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
    async addOwner(id, userId, now) {
      const [row] = await (await db())`
        WITH owners AS (SELECT user_id FROM diary_access WHERE diary_id = ${id}),
        added AS (
          INSERT INTO diary_access (diary_id, user_id, added_at)
          SELECT ${id}, ${userId}, ${now}
          WHERE NOT EXISTS (SELECT 1 FROM owners) AND EXISTS (SELECT 1 FROM diaries WHERE id = ${id})
          ON CONFLICT DO NOTHING
          RETURNING user_id)
        SELECT (SELECT count(*) FROM added) AS added, ARRAY(SELECT user_id FROM owners) AS owners`
      if (Number(row.added) === 1) return 'added'
      return (row.owners as string[]).includes(userId) ? 'already' : 'taken'
    },
    async kids(userId) {
      const rows = await (await db())`
        SELECT d.id, d.progress->>'name' AS name, d.updated_at
        FROM diary_access a JOIN diaries d ON d.id = a.diary_id
        WHERE a.user_id = ${userId}
        ORDER BY a.added_at, d.id`
      return rows.map((row) => ({ id: String(row.id), name: String(row.name ?? ''), updatedAt: Number(row.updated_at) }))
    },
  }
}

/** Neon's database, over HTTP. */
function neonStore(): Store {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return postgresStore(neon(url))
}

let store: Store | undefined

export default {
  fetch: createHandler(
    () => (store ??= neonStore()),
    () => process.env.DIARY_SECRET,
    () => process.env.DIARY_PROXY_KEY,
    // Loaded only when a request needs it, so diaries without a grown-up start as fast as before.
    async () => (await import('../server/production.js')).productionAccounts(),
    process.env.AUTH_PUBLIC_ORIGIN ?? 'https://www.todd.sh',
  ),
}
