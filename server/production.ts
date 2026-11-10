import { Pool } from 'pg'
import { accountsFrom, type Accounts } from './accounts.js'
import { AUTH_SCHEMA, AUTH_SCHEMA_READY } from './auth-schema.js'
import { createAuth, type Auth, type AuthEnv } from './auth.js'

let ready: Promise<Auth> | undefined

/**
 * One Better Auth per instance, for both API functions, with its tables made on first use like
 * the diary API's. Null until BETTER_AUTH_SECRET is set.
 */
export function productionAuth(): Promise<Auth | null> {
  const env = process.env as AuthEnv
  if (!env.BETTER_AUTH_SECRET) return Promise.resolve(null)
  ready ??= (async () => {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    const pool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 5_000 })
    const { rows } = await pool.query<{ ready: boolean }>(AUTH_SCHEMA_READY)
    if (!rows[0]?.ready) for (const statement of AUTH_SCHEMA) await pool.query(statement)
    return createAuth(env, pool)
  })().catch((err: unknown) => {
    ready = undefined
    throw err
  })
  return ready
}

let made: { auth: Auth; accounts: Accounts } | undefined

/** The diary API's view of sign-in. Null until BETTER_AUTH_SECRET is set. */
export async function productionAccounts(): Promise<Accounts | null> {
  const auth = await productionAuth()
  if (!auth) return null
  if (made?.auth !== auth) made = { auth, accounts: accountsFrom(auth) }
  return made.accounts
}
