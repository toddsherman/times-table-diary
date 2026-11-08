import { memoryAdapter } from 'better-auth/adapters/memory'

/**
 * Better Auth's in-memory database with every sign-in table there from the start, as on Postgres.
 * (It only knows a table once something is written to it, so a lookup in an empty one fails.)
 */
export const memoryAuthDb = () =>
  memoryAdapter({ auth_user: [], auth_session: [], auth_account: [], auth_verification: [], auth_device_code: [] })
