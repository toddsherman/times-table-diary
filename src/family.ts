// The grown-up page's calls to the diary API (api/diary.ts): your kids, link codes, and linked
// iPads. They go with your sign-in cookie, so they only work signed in.

import { dayNumber } from './engine/dates'
import { createProgress } from './engine/progress'
import type { Progress } from './engine/types'
import { parseProgress, type CloudLink } from './storage'

export interface Kid {
  id: string
  name: string
  updatedAt: number
}

export interface LinkedIPad {
  id: string
  diaryId: string | null
  name: string | null
  linkedAt: number
  lastSeen: number
}

/** The diary an iPad already has, from its link code. */
export interface Offered {
  name: string
  /** 'free': no grown-up yet; 'yours': already in your account; 'taken': in someone else's. */
  status: 'free' | 'yours' | 'taken'
}

const MESSAGES: Record<string, string> = {
  bad_code: "That code didn't work. Check it against the iPad, or ask the iPad for a new one.",
  bad_name: 'Write their name first.',
  bad_pin: 'The family PIN needs 4 to 8 digits.',
  has_grown_up: "That diary is already in another grown-up's account.",
  not_found: "Couldn't find a diary with that name and PIN. Check the spelling?",
  not_yours: "That diary isn't in your account.",
  too_many: 'Too many tries. Wait a few minutes, then try again.',
  not_ready: "Sign-in isn't set up yet.",
  link_needed: "You've been signed out. Sign in again?",
  offline: "Can't reach the internet right now.",
  server: 'Something went wrong. Try again?',
}

export class FamilyError extends Error {
  readonly code: string

  constructor(code: string) {
    super(MESSAGES[code] ?? MESSAGES.server)
    this.code = code
  }
}

const API = `${import.meta.env.BASE_URL}api/diary`

async function call<T>(query: Record<string, string>, method = 'GET', body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API}?${new URLSearchParams(query)}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new FamilyError('offline')
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new FamilyError(typeof data.error === 'string' ? data.error : 'server')
  return data as T
}

export const listKids = async () => (await call<{ kids: Kid[] }>({ op: 'kids' })).kids

/** A new kid's diary, starting today. */
export const addKid = (name: string) => call<{ id: string }>({ op: 'kids' }, 'POST', { progress: createProgress(name.trim(), dayNumber()) })

/** Brings a diary made with a name and family PIN into your account. */
export const attachDiary = (name: string, pin: string) => call<{ id: string; name: string }>({ op: 'attach' }, 'POST', { name, pin })

/** Looks at a link code (which claims it for you), and the diary that iPad already has, if any. */
export const checkCode = async (code: string) => (await call<{ offered: Offered | null }>({ op: 'link', code })).offered

/** Links the iPad to a kid: `diaryId`, or without it, the diary the iPad already has. */
export const approveCode = (code: string, diaryId?: string) => call<{ diaryId: string }>({ op: 'link' }, 'POST', { code, diaryId })

export const listIPads = async () => (await call<{ devices: LinkedIPad[] }>({ op: 'devices' })).devices

export const unlinkIPad = (id: string) => call({ op: 'devices', device: id }, 'DELETE')

/** A kid's diary, for their progress report. */
export async function openKid(id: string): Promise<{ progress: Progress; link: CloudLink }> {
  const body = await call<{ progress: unknown; version: number }>({ id })
  return { progress: parseProgress(JSON.stringify(body.progress)), link: { id, version: body.version, syncedAt: Date.now() } }
}

/** Deletes a kid's diary for good, which also unlinks their iPads. */
export const deleteKid = (id: string) => call({ id }, 'DELETE')
