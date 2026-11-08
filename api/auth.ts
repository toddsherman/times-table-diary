import { Pool } from 'pg'
import { AUTH_SCHEMA } from '../server/auth-schema.js'
import { createAuth, publicRequest, type AuthEnv } from '../server/auth.js'

/**
 * Grown-up sign-in (see server/auth.ts). The app calls it as
 * www.todd.sh/timesTableDiary/App/api/auth/…; todd.sh forwards those requests here, and vercel.json
 * rewrites them to this function, which still sees the original address.
 *
 * Until BETTER_AUTH_SECRET is set it answers 503, so the API can go live before sign-in is set up.
 */

type Auth = ReturnType<typeof createAuth>

export function createAuthHandler(getAuth: () => Promise<Auth | null>, env: AuthEnv) {
  return async function handle(request: Request): Promise<Response> {
    try {
      const auth = await getAuth()
      if (!auth) return Response.json({ error: 'not_ready' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
      return await auth.handler(await publicRequest(request, env))
    } catch (err) {
      console.error(err)
      return Response.json({ error: 'server' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    }
  }
}

let ready: Promise<Auth> | undefined

/** One Better Auth per instance, with its tables made on first use like the diary API's. */
function productionAuth(): Promise<Auth | null> {
  const env = process.env as AuthEnv
  if (!env.BETTER_AUTH_SECRET) return Promise.resolve(null)
  ready ??= (async () => {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    const pool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 5_000 })
    for (const statement of AUTH_SCHEMA) await pool.query(statement)
    return createAuth(env, pool)
  })().catch((err: unknown) => {
    ready = undefined
    throw err
  })
  return ready
}

export default {
  fetch: createAuthHandler(productionAuth, process.env as AuthEnv),
}
