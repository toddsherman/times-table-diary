// Grown-up sign-in, with Better Auth (https://better-auth.com).
//
// Grown-ups sign in with Google or Apple on their own phone or computer. A kid's iPad never signs
// in: it shows a link code, a signed-in grown-up approves it, and the iPad gets its own long-lived
// session token (the device authorization plugin, plus the bearer plugin to send it).
//
// Everything is served under the app's own path on www.todd.sh, so the session cookie belongs to
// that site. Safari blocks cookies from other sites, which is why there's no separate sign-in host.

import { betterAuth, type BetterAuthOptions, type BetterAuthPlugin } from 'better-auth'
import { bearer, deviceAuthorization } from 'better-auth/plugins'
import { importPKCS8, SignJWT } from 'jose'
import { clientIp } from './client-ip.js'

/** Where the app lives for visitors. */
export const APP_PATH = '/timesTableDiary/App'
export const AUTH_PATH = `${APP_PATH}/api/auth`
/** The only client that may ask for a link code: this app, on a kid's iPad. */
export const DEVICE_CLIENT_ID = 'times-table-diary'
/** Set by the API to the visitor's address, for Better Auth's rate limits. Never taken from the request. */
export const CLIENT_IP_HEADER = 'x-ttd-client-ip'
/**
 * Where approving a link code leaves the diary chosen for that iPad, until the iPad picks up its
 * session (a Better Auth verification value, keyed by the iPad's secret device code).
 */
export const linkChoice = (deviceCode: string) => `diary-link:${deviceCode}`
/** What an iPad offers when it asks for a link code: the diary it already has, as the code's scope. */
export const OFFER_PREFIX = 'diary:'
/**
 * All a linked iPad may do with sign-in itself: check its session, leave, and ask for a new code.
 * Everything else (approving codes, adding a Google or Apple account, ending other sessions) needs
 * a grown-up's own sign-in.
 */
export const DEVICE_ROUTES = new Set(['get-session', 'sign-out', 'device/code', 'device/token', 'ok', 'error'])

/** The two fields this app adds to every session. */
export interface SessionKind {
  /** True for an iPad's session from a link code; false for a grown-up's own sign-in. */
  linkedDevice?: boolean | null
  /** For a linked iPad, the one diary it may open. */
  diaryId?: string | null
}

export interface AuthEnv {
  BETTER_AUTH_SECRET?: string
  /** https://www.todd.sh unless set, e.g. to http://localhost:3000 for a local run. */
  AUTH_PUBLIC_ORIGIN?: string
  DIARY_PROXY_KEY?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  APPLE_CLIENT_ID?: string
  APPLE_TEAM_ID?: string
  APPLE_KEY_ID?: string
  /** The .p8 key's contents. Line breaks may be written as \n. */
  APPLE_PRIVATE_KEY?: string
}

const DAY = 24 * 60 * 60

export function publicOrigin(env: AuthEnv): string {
  return env.AUTH_PUBLIC_ORIGIN ?? 'https://www.todd.sh'
}

export function authOptions(env: AuthEnv, database: BetterAuthOptions['database'], extraPlugins: BetterAuthPlugin[] = []): BetterAuthOptions {
  const origin = publicOrigin(env)
  return {
    appName: 'Times Table Diary',
    baseURL: origin,
    basePath: AUTH_PATH,
    secret: env.BETTER_AUTH_SECRET,
    database,
    // Apple sends its answer back as a form post from its own site.
    trustedOrigins: [origin, 'https://appleid.apple.com'],
    socialProviders: socialProviders(env),
    // A sign-in that goes wrong lands back on the grown-up page, which says so.
    onAPIError: { errorURL: `${origin}${APP_PATH}?grownups=error` },
    // The tables start with auth_ so they sit plainly beside diaries and answers (see AUTH_SCHEMA).
    user: { modelName: 'auth_user' },
    account: { modelName: 'auth_account', accountLinking: { enabled: true, trustedProviders: ['google', 'apple'] } },
    verification: { modelName: 'auth_verification' },
    // A kid's iPad should stay linked: a year, renewed whenever it's used.
    session: {
      modelName: 'auth_session',
      expiresIn: 365 * DAY,
      updateAge: DAY,
      // Set only by the hook below; nobody can set them through the API.
      additionalFields: {
        linkedDevice: { type: 'boolean', required: false, defaultValue: false, input: false },
        diaryId: { type: 'string', required: false, input: false },
      },
    },
    plugins: [
      deviceAuthorization({
        expiresIn: '15m',
        interval: '5s',
        validateClient: (clientId) => clientId === DEVICE_CLIENT_ID,
        verificationUri: `${origin}${APP_PATH}?grownups=link`,
        schema: { deviceCode: { modelName: 'auth_device_code' } },
      }),
      bearer(),
      ...extraPlugins,
    ],
    // Google and Apple only tell us who's signing in. Their tokens aren't needed, so they aren't kept.
    databaseHooks: {
      account: {
        create: { before: async (account) => ({ data: withoutTokens(account) }) },
        update: { before: async (account) => ({ data: withoutTokens(account) }) },
      },
      session: {
        create: {
          // A session made by redeeming a link code is an iPad's, tied to the diary chosen when
          // the code was approved. Every other session is a grown-up's own sign-in.
          before: async (session, ctx) => {
            if (ctx?.path !== '/device/token') return { data: { ...session, linkedDevice: false, diaryId: null } }
            const deviceCode = (ctx.body as { device_code?: unknown } | undefined)?.device_code
            const choice = typeof deviceCode === 'string' ? await ctx.context.internalAdapter.consumeVerificationValue(linkChoice(deviceCode)) : null
            return { data: { ...session, linkedDevice: true, diaryId: choice?.value ?? null } }
          },
        },
      },
    },
    advanced: {
      cookiePrefix: 'ttd',
      useSecureCookies: origin.startsWith('https:'),
      // Only the app's own pages and API see its cookies, not the rest of www.todd.sh.
      defaultCookieAttributes: { path: APP_PATH },
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
      // Better Auth skips its other-site check when NODE_ENV is test; keep it on everywhere.
      disableOriginCheck: false,
    },
    telemetry: { enabled: false },
  }
}

export function createAuth(env: AuthEnv, database: BetterAuthOptions['database'], extraPlugins: BetterAuthPlugin[] = []) {
  return betterAuth(authOptions(env, database, extraPlugins))
}

export type Auth = ReturnType<typeof createAuth>

/** True when a linked iPad asks sign-in for something outside DEVICE_ROUTES (see publicRequest). */
export async function deviceOverreach(auth: Auth, request: Request): Promise<boolean> {
  const route = new URL(request.url).pathname.slice(AUTH_PATH.length + 1)
  if (DEVICE_ROUTES.has(route)) return false
  if (!request.headers.has('cookie') && !request.headers.has('authorization')) return false
  const found = await auth.api.getSession({ headers: request.headers, query: { disableRefresh: true } })
  return (found?.session as SessionKind | undefined)?.linkedDevice === true
}

function withoutTokens<T extends object>(account: T): T {
  return { ...account, accessToken: null, refreshToken: null, idToken: null, accessTokenExpiresAt: null, refreshTokenExpiresAt: null }
}

/** Google and Apple, each only once its keys are set, so the API can go live before them. */
function socialProviders(env: AuthEnv): NonNullable<BetterAuthOptions['socialProviders']> {
  const providers: NonNullable<BetterAuthOptions['socialProviders']> = {}
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' }
  }
  const { APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = env
  if (APPLE_CLIENT_ID && APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_PRIVATE_KEY) {
    providers.apple = async () => ({
      clientId: APPLE_CLIENT_ID,
      clientSecret: await appleClientSecret(APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY),
    })
  }
  return providers
}

let appleSecret: { value: string; until: number } | undefined

/**
 * Apple wants a JWT signed with the .p8 key instead of a fixed secret, and refuses any that last
 * over six months. This makes one that lasts 90 days and makes a new one after 30, so there's
 * nothing to renew by hand.
 */
async function appleClientSecret(clientId: string, teamId: string, keyId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (appleSecret && appleSecret.until > now) return appleSecret.value
  const key = await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'ES256')
  const value = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 90 * DAY)
    .sign(key)
  appleSecret = { value, until: now + 30 * DAY }
  return value
}

/**
 * The request as Better Auth should see it: at its public address on www.todd.sh, whatever host
 * or rewrite it came through, with the visitor's address in CLIENT_IP_HEADER.
 */
export async function publicRequest(request: Request, env: AuthEnv): Promise<Request> {
  const incoming = new URL(request.url)
  const at = incoming.pathname.indexOf('/api/auth/')
  const route = at === -1 ? '' : incoming.pathname.slice(at + '/api/auth/'.length)
  // Vercel's rewrite also passes the matched path as ?path=; it isn't part of the request.
  if (incoming.searchParams.get('path') === route) incoming.searchParams.delete('path')
  const url = new URL(`${AUTH_PATH}/${route}`, publicOrigin(env))
  url.search = incoming.search

  const headers = new Headers(request.headers)
  headers.set(CLIENT_IP_HEADER, clientIp(request, env.DIARY_PROXY_KEY))
  headers.delete('x-diary-client-ip')
  headers.delete('x-diary-proxy-key')

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  return new Request(url, { method: request.method, headers, body: hasBody ? await request.arrayBuffer() : undefined })
}
