import { memoryAuthDb } from './memory-auth'
import { getMigrations } from 'better-auth/db/migration'
import { testUtils } from 'better-auth/plugins'
import { exportPKCS8, exportSPKI, generateKeyPair, importSPKI, jwtVerify } from 'jose'
import { Pool } from 'pg'
import { afterAll, describe, expect, it } from 'vitest'
import { createAuthHandler } from '../api/auth'
import { AUTH_SCHEMA, AUTH_SCHEMA_READY } from '../server/auth-schema'
import { authOptions, CLIENT_IP_HEADER, createAuth, DEVICE_CLIENT_ID, publicRequest, type AuthEnv } from '../server/auth'

const SECRET = 'test-secret-that-is-long-enough-for-better-auth'
const env: AuthEnv = { BETTER_AUTH_SECRET: SECRET, DIARY_PROXY_KEY: 'proxy-key' }
const SITE = 'https://www.todd.sh'

describe('publicRequest', () => {
  it('puts a request back at its public address, without the path Vercel adds', async () => {
    const req = new Request('https://times-table-diary.vercel.app/timesTableDiary/App/api/auth/device/code?x=1&path=device%2Fcode', {
      method: 'POST',
      body: '{}',
    })
    const out = await publicRequest(req, env)
    expect(out.url).toBe(`${SITE}/timesTableDiary/App/api/auth/device/code?x=1`)
    expect(await out.text()).toBe('{}')
  })

  it('believes the forwarded address only with the proxy key, and never a client-set one', async () => {
    const forged = new Request('https://x/timesTableDiary/App/api/auth/ok', {
      headers: { [CLIENT_IP_HEADER]: '6.6.6.6', 'x-diary-client-ip': '7.7.7.7', 'x-real-ip': '1.2.3.4' },
    })
    expect((await publicRequest(forged, env)).headers.get(CLIENT_IP_HEADER)).toBe('1.2.3.4')

    const proxied = new Request('https://x/timesTableDiary/App/api/auth/ok', {
      headers: { 'x-diary-client-ip': '7.7.7.7', 'x-diary-proxy-key': 'proxy-key', 'x-real-ip': '1.2.3.4' },
    })
    const out = await publicRequest(proxied, env)
    expect(out.headers.get(CLIENT_IP_HEADER)).toBe('7.7.7.7')
    expect(out.headers.get('x-diary-proxy-key')).toBeNull()
  })
})

it('answers 503 until sign-in is set up', async () => {
  const handle = createAuthHandler(async () => null, env)
  expect((await handle(new Request('https://x/timesTableDiary/App/api/auth/get-session'))).status).toBe(503)
})

it("makes Apple's client secret from the .p8 key", async () => {
  const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true })
  const pem = (await exportPKCS8(privateKey)).replace(/\n/g, '\\n') // as pasted into one line
  const auth = createAuth(
    { ...env, APPLE_CLIENT_ID: 'sh.todd.diary.web', APPLE_TEAM_ID: 'TEAM123456', APPLE_KEY_ID: 'KEY1234567', APPLE_PRIVATE_KEY: pem },
    memoryAuthDb(),
  )
  const provider = (await auth.$context).socialProviders.find((p) => p.id === 'apple')
  expect(provider).toBeDefined()
  const secret = String((provider as unknown as { options: { clientSecret: string } }).options.clientSecret)
  const { payload, protectedHeader } = await jwtVerify(secret, await importSPKI(await exportSPKI(publicKey), 'ES256'), {
    issuer: 'TEAM123456',
    subject: 'sh.todd.diary.web',
    audience: 'https://appleid.apple.com',
  })
  expect(protectedHeader.kid).toBe('KEY1234567')
  expect(Number(payload.exp) - Number(payload.iat)).toBeLessThan(15_777_000)
})

const pgUrl = process.env.TEST_DATABASE_URL
const pools: Pool[] = []
afterAll(async () => {
  await Promise.all(pools.map((p) => p.end()))
})

async function freshPool(): Promise<Pool> {
  const pool = new Pool({ connectionString: pgUrl })
  pools.push(pool)
  await pool.query('DROP TABLE IF EXISTS "auth_device_code", "auth_verification", "auth_account", "auth_session", "auth_user" CASCADE')
  for (const statement of AUTH_SCHEMA) await pool.query(statement)
  return pool
}

describe.runIf(pgUrl)('AUTH_SCHEMA (needs TEST_DATABASE_URL)', () => {
  it("matches what Better Auth's planner wants, and runs twice", async () => {
    const pool = await freshPool()
    for (const statement of AUTH_SCHEMA) await pool.query(statement)
    const plan = await getMigrations(authOptions(env, pool))
    expect(plan.toBeCreated).toEqual([])
    expect(plan.toBeAdded).toEqual([])
    expect(plan.toBeAddedIndexes).toEqual([])
  })

  it('knows whether the tables are all there yet', async () => {
    const pool = await freshPool()
    const ready = async () => (await pool.query<{ ready: boolean }>(AUTH_SCHEMA_READY)).rows[0].ready
    expect(await ready()).toBe(true)
    // As the first tables went out: before linked iPads had their columns.
    await pool.query('ALTER TABLE "auth_session" DROP COLUMN "diaryId"')
    expect(await ready()).toBe(false)
    await pool.query('DROP TABLE "auth_device_code"')
    expect(await ready()).toBe(false)
  })
})

const databases: Array<[string, () => Promise<Parameters<typeof createAuth>[1]>]> = [['memory', async () => memoryAuthDb()]]
if (pgUrl) databases.push(['postgres', freshPool])

describe.each(databases)('linking an iPad (%s)', (_name, database) => {
  async function setup() {
    const auth = createAuth(env, await database(), [testUtils()])
    const handle = createAuthHandler(async () => auth, env)
    const ctx = (await auth.$context) as unknown as { test: import('better-auth/plugins').TestHelpers }
    const grownUp = await ctx.test.saveUser(ctx.test.createUser({ email: 'grownup@example.com', name: 'Grown Up' }))
    const { headers: signedIn } = await ctx.test.login({ userId: grownUp.id })
    const call = (route: string, init: RequestInit & { json?: unknown } = {}) => {
      const headers = new Headers(init.headers)
      if (init.json !== undefined) headers.set('content-type', 'application/json')
      return handle(
        new Request(`https://times-table-diary.vercel.app/timesTableDiary/App/api/auth/${route}`, {
          ...init,
          headers,
          body: init.json === undefined ? init.body : JSON.stringify(init.json),
        }),
      )
    }
    const asGrownUp = (extra: Record<string, string> = {}) => {
      const headers = new Headers(signedIn)
      headers.set('origin', SITE)
      for (const [k, v] of Object.entries(extra)) headers.set(k, v)
      return headers
    }
    return { call, asGrownUp, grownUp }
  }

  const poll = (call: Awaited<ReturnType<typeof setup>>['call'], deviceCode: string) =>
    call('device/token', {
      method: 'POST',
      json: { grant_type: 'urn:ietf:params:oauth:grant-type:device_code', device_code: deviceCode, client_id: DEVICE_CLIENT_ID },
    })

  it('gives the iPad its own session once a signed-in grown-up approves the code', async () => {
    const { call, asGrownUp, grownUp } = await setup()

    const codeRes = await call('device/code', { method: 'POST', json: { client_id: DEVICE_CLIENT_ID } })
    expect(codeRes.status).toBe(200)
    const code = (await codeRes.json()) as { device_code: string; user_code: string; verification_uri_complete: string }
    expect(code.verification_uri_complete).toBe(`${SITE}/timesTableDiary/App?grownups=link&user_code=${code.user_code}`)

    const pending = await poll(call, code.device_code)
    expect(pending.status).toBe(400)
    expect(((await pending.json()) as { error: string }).error).toBe('authorization_pending')

    const seen = await call(`device?user_code=${code.user_code}`, { headers: asGrownUp() })
    expect(seen.status).toBe(200)
    const approved = await call('device/approve', { method: 'POST', headers: asGrownUp(), json: { userCode: code.user_code } })
    expect(approved.status).toBe(200)

    // Wait out the polling interval so the next poll isn't told to slow down.
    await new Promise((r) => setTimeout(r, 5_100))
    const tokenRes = await poll(call, code.device_code)
    expect(tokenRes.status).toBe(200)
    const { access_token } = (await tokenRes.json()) as { access_token: string }

    const session = await call('get-session', { headers: { authorization: `Bearer ${access_token}` } })
    const body = (await session.json()) as { user: { id: string; email: string }; session: { expiresAt: string } }
    expect(body.user.id).toBe(grownUp.id)
    const days = (new Date(body.session.expiresAt).getTime() - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(360)
  }, 15_000)

  it("never touches a grown-up's cookie when a request carries an iPad's token", async () => {
    const { call, asGrownUp } = await setup()
    // A token that has ended, sent from the browser where a grown-up is signed in.
    const res = await call('get-session', { headers: asGrownUp({ authorization: 'Bearer token-that-has-ended' }) })
    expect(res.status).toBe(200)
    expect(res.headers.getSetCookie()).toEqual([])
    // The grown-up's own requests still get their cookies as usual.
    const out = await call('sign-out', { method: 'POST', headers: asGrownUp(), json: {} })
    expect(out.headers.getSetCookie().some((c) => c.includes('session_token='))).toBe(true)
  })

  it('refuses a code request from any other client', async () => {
    const { call } = await setup()
    const res = await call('device/code', { method: 'POST', json: { client_id: 'someone-else' } })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toBe('invalid_client')
  })

  it('refuses an approval sent from another site', async () => {
    const { call, asGrownUp } = await setup()
    const code = (await (await call('device/code', { method: 'POST', json: { client_id: DEVICE_CLIENT_ID } })).json()) as { user_code: string }
    await call(`device?user_code=${code.user_code}`, { headers: asGrownUp() })
    const res = await call('device/approve', { method: 'POST', headers: asGrownUp({ origin: 'https://evil.example' }), json: { userCode: code.user_code } })
    expect(res.status).toBe(403)
  })
})
