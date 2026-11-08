// What the diary API needs from sign-in: who's asking, link codes, and a grown-up's linked iPads.
// Everything goes through Better Auth's own storage, so it works the same on Postgres and in tests.

import { linkChoice, OFFER_PREFIX, type Auth, type SessionKind } from './auth.js'

export interface Viewer {
  userId: string
  sessionId: string
  /** A kid's iPad, linked by a code, rather than a grown-up's own sign-in. */
  device: boolean
  /** For an iPad, the one diary it may open. */
  diaryId: string | null
}

export interface LinkedDevice {
  id: string
  diaryId: string | null
  linkedAt: number
  /** Within a day: sessions note their use at most once a day. */
  lastSeen: number
}

export interface Accounts {
  /** Who's asking, from a session cookie or a bearer token, plus any refreshed cookies to pass back. */
  viewer(request: Request): Promise<{ viewer: Viewer | null; setCookies: string[] }>
  /**
   * A link code that's waiting for approval. Looking at it claims it for this grown-up, as Better
   * Auth's own check does, so nobody else can approve it. Null if it's unknown, used, expired, or
   * someone else's.
   */
  linkCode(userCode: string, userId: string): Promise<{ offeredDiaryId: string | null } | null>
  /** Approves a link code, tying the iPad's coming session to `diaryId`. */
  approveLink(userCode: string, userId: string, diaryId: string): Promise<boolean>
  devices(userId: string): Promise<LinkedDevice[]>
  /** Ends one of this grown-up's iPad sessions. */
  removeDevice(userId: string, sessionId: string): Promise<boolean>
  /** Ends every iPad session tied to a diary, once the diary is gone. */
  forgetDiary(diaryId: string): Promise<void>
}

interface DeviceCodeRow {
  id: string
  deviceCode: string
  userCode: string
  userId?: string | null
  expiresAt: Date
  status: string
  scope?: string | null
}

type SessionRow = SessionKind & { id: string; token: string; userId: string; createdAt: Date; updatedAt: Date; expiresAt: Date }

const DIARY_ID = /^[0-9a-f]{64}$/

export function accountsFrom(auth: Auth): Accounts {
  const context = auth.$context

  async function pendingCode(userCode: string, userId: string): Promise<DeviceCodeRow | null> {
    const { adapter } = await context
    const find = (value: string) => adapter.findOne<DeviceCodeRow>({ model: 'deviceCode', where: [{ field: 'userCode', value }] })
    // Codes are shown as capitals and digits; people type them however they like.
    const code = (await find(userCode)) ?? (await find(userCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()))
    if (!code || code.status !== 'pending' || new Date(code.expiresAt) < new Date()) return null
    if (code.userId && code.userId !== userId) return null
    if (!code.userId) {
      const claimed = await adapter.update<DeviceCodeRow>({
        model: 'deviceCode',
        where: [
          { field: 'id', value: code.id },
          { field: 'status', value: 'pending' },
        ],
        update: { userId },
      })
      if (!claimed) return null
    }
    return { ...code, userId }
  }

  return {
    async viewer(request) {
      if (!request.headers.has('cookie') && !request.headers.has('authorization')) return { viewer: null, setCookies: [] }
      const { headers, response } = await auth.api.getSession({ headers: request.headers, returnHeaders: true })
      const setCookies = headers?.getSetCookie() ?? []
      if (!response) return { viewer: null, setCookies }
      const session = response.session as typeof response.session & SessionKind
      return {
        viewer: { userId: response.user.id, sessionId: session.id, device: session.linkedDevice === true, diaryId: session.diaryId ?? null },
        setCookies,
      }
    },

    async linkCode(userCode, userId) {
      const code = await pendingCode(userCode, userId)
      if (!code) return null
      const offered = code.scope?.startsWith(OFFER_PREFIX) ? code.scope.slice(OFFER_PREFIX.length) : null
      return { offeredDiaryId: offered && DIARY_ID.test(offered) ? offered : null }
    },

    async approveLink(userCode, userId, diaryId) {
      const code = await pendingCode(userCode, userId)
      if (!code) return false
      const { adapter, internalAdapter } = await context
      // Leave the choice first, so it's there whenever the iPad picks up its session.
      await internalAdapter.createVerificationValue({ identifier: linkChoice(code.deviceCode), value: diaryId, expiresAt: new Date(code.expiresAt) })
      const approved = await adapter.update<DeviceCodeRow>({
        model: 'deviceCode',
        where: [
          { field: 'id', value: code.id },
          { field: 'status', value: 'pending' },
        ],
        update: { status: 'approved', userId },
      })
      return approved !== null
    },

    async devices(userId) {
      const { adapter } = await context
      const sessions = await adapter.findMany<SessionRow>({
        model: 'session',
        where: [
          { field: 'userId', value: userId },
          { field: 'linkedDevice', value: true },
        ],
      })
      const now = Date.now()
      return sessions
        .filter((s) => new Date(s.expiresAt).getTime() > now)
        .map((s) => ({ id: s.id, diaryId: s.diaryId ?? null, linkedAt: new Date(s.createdAt).getTime(), lastSeen: new Date(s.updatedAt).getTime() }))
        .sort((a, b) => a.linkedAt - b.linkedAt)
    },

    async removeDevice(userId, sessionId) {
      const { adapter, internalAdapter } = await context
      const session = await adapter.findOne<SessionRow>({
        model: 'session',
        where: [
          { field: 'id', value: sessionId },
          { field: 'userId', value: userId },
          { field: 'linkedDevice', value: true },
        ],
      })
      if (!session) return false
      await internalAdapter.deleteSession(session.token)
      return true
    },

    async forgetDiary(diaryId) {
      const { adapter } = await context
      await adapter.deleteMany({ model: 'session', where: [{ field: 'diaryId', value: diaryId }] })
    },
  }
}
