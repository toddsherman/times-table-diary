import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { authClient, DEVICE_CLIENT_ID, grownUpsUrl } from '../auth-client'
import { TopBar } from '../components/TopBar'
import type { Progress } from '../engine/types'
import {
  addKid,
  approveCode,
  attachDiary,
  checkCode,
  deleteKid,
  FamilyError,
  listIPads,
  listKids,
  openKid,
  unlinkIPad,
  type Kid,
  type LinkedIPad,
  type Offered,
} from '../family'
import { timeAgo } from '../format'
import type { CloudLink } from '../storage'
import { getTheme, ThemeContext } from '../themes'
import { Report } from './Report'

// The grown-up page, at /timesTableDiary/App?grownups. Grown-ups sign in with Google or Apple on
// their own phone or computer. From here they see their kids' diaries and reports, add a kid, and
// link a kid's iPad by approving the code it shows. Nothing in the kids' app links here yet.

interface User {
  id: string
  name: string
  email: string
}

const TEST_TOKEN_KEY = 'times-table-diary-link-test'
const GRANT = 'urn:ietf:params:oauth:grant-type:device_code'
const API = `${import.meta.env.BASE_URL}api/diary`

const goToApp = () => location.assign(import.meta.env.BASE_URL.replace(/\/$/, ''))

/** Takes a handled link code out of the address, so reloading the page doesn't check it again. */
function forgetCodeInAddress(): void {
  const url = new URL(location.href)
  if (!url.searchParams.has('user_code')) return
  url.searchParams.delete('user_code')
  url.searchParams.set('grownups', '')
  history.replaceState(history.state, '', url)
}

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Try again?')

/** "today", "yesterday", or a date like "Nov 8". */
function dayLabel(at: number, now = Date.now()): string {
  const day = (ms: number) => new Date(ms).toDateString()
  if (day(at) === day(now)) return 'today'
  if (day(at) === day(now - 86_400_000)) return 'yesterday'
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function GrownUps() {
  // As the page was opened: a link code in the address puts linking first, even once it's handled.
  const [params] = useState(() => new URLSearchParams(location.search))
  const linkCode = params.get('user_code') ?? ''
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [error, setError] = useState(params.get('error') ? "Sign-in didn't finish. Try again?" : '')
  const [report, setReport] = useState<{ progress: Progress; link: CloudLink } | null>(null)
  const scrolledTo = useRef(0)

  useEffect(() => {
    authClient
      .getSession()
      .then(({ data }) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
  }, [])

  const signedOut = useCallback(() => {
    setUser(null)
    setError("You've been signed out. Sign in again?")
  }, [setUser, setError])

  const signIn = async (provider: 'google' | 'apple') => {
    setError('')
    // Come back here, keeping any link code that brought you.
    const back = grownUpsUrl(linkCode ? `=link&user_code=${encodeURIComponent(linkCode)}` : '')
    const { error: err } = await authClient.signIn.social({ provider, callbackURL: back, errorCallbackURL: grownUpsUrl('&error=1') })
    if (!err) return
    const name = provider === 'google' ? 'Google' : 'Apple'
    setError(err.status === 404 ? `${name} sign-in isn't set up yet.` : `Couldn't start signing in with ${name}. Try again?`)
  }

  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
  }

  const showReport = (found: { progress: Progress; link: CloudLink }) => {
    scrolledTo.current = window.scrollY
    setReport(found)
  }

  // The report starts at its top; coming back returns to where the page was.
  useLayoutEffect(() => {
    window.scrollTo(0, report ? 0 : scrolledTo.current)
  }, [report])

  return (
    <>
      {report && (
        // In the kid's own look's words (what their pages call things), on the grown-up page's colors.
        <ThemeContext.Provider value={getTheme(report.progress.settings.theme)}>
          <Report progress={report.progress} link={report.link} withQueued={false} onBack={() => setReport(null)} />
        </ThemeContext.Provider>
      )}
      {/* Stays put under the report, so nothing reloads or rechecks on the way back. */}
      <div className="screen settings grown-up-page" style={report ? { display: 'none' } : undefined}>
        <TopBar title="Grown-ups" onBack={goToApp} />

        <section className="card panel">
          <h2>Your account</h2>
          {user === undefined ? (
            <p>Checking…</p>
          ) : user ? (
            <>
              <p>
                Signed in as {user.name} ({user.email}).
              </p>
              <div className="row">
                <button type="button" className="btn small" onClick={signOut}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <p>Sign in to look after your kids' diaries and link their iPads.</p>
              <div className="row">
                <button type="button" className="btn small teal" onClick={() => signIn('google')}>
                  Sign in with Google
                </button>
                <button type="button" className="btn small purple" onClick={() => signIn('apple')}>
                  Sign in with Apple
                </button>
              </div>
            </>
          )}
          {error && <p className="error">{error}</p>}
        </section>

        {user && <Family linkCode={linkCode} onSignedOut={signedOut} onReport={showReport} />}
        {user === null && linkCode && (
          <section className="card panel">
            <h2>Link an iPad</h2>
            <p>
              Sign in first, then you can link the iPad showing <b className="link-code">{linkCode}</b>.
            </p>
          </section>
        )}

        <TestLink />
      </div>
    </>
  )
}

interface FamilyProps {
  linkCode: string
  onSignedOut: () => void
  onReport: (found: { progress: Progress; link: CloudLink }) => void
}

/** Everything for a signed-in grown-up: linking an iPad, their kids, and their linked iPads. */
function Family({ linkCode, onSignedOut, onReport }: FamilyProps) {
  const [kids, setKids] = useState<Kid[] | null>(null)
  const [iPads, setIPads] = useState<LinkedIPad[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [version, setVersion] = useState(0)
  const reload = () => setVersion((v) => v + 1)

  /** Shows a call's error, or notices the session has ended. */
  const problem = useCallback(
    (err: unknown, show: (message: string) => void) => {
      if (err instanceof FamilyError && err.code === 'link_needed') onSignedOut()
      else show(messageOf(err))
    },
    [onSignedOut],
  )

  useEffect(() => {
    let live = true
    Promise.all([listKids(), listIPads()])
      .then(([k, d]) => {
        if (!live) return
        setKids(k)
        setIPads(d)
        setLoadError('')
      })
      .catch((err: unknown) => live && problem(err, setLoadError))
    return () => {
      live = false
    }
  }, [version, problem])

  // A newly linked iPad shows up once it has picked up its session, within a few seconds.
  const afterLinking = () => {
    reload()
    window.setTimeout(reload, 6_000)
    window.setTimeout(reload, 15_000)
  }

  const link = <LinkIPad key="link" initial={linkCode} kids={kids} onLinked={afterLinking} problem={problem} />
  return (
    <>
      {linkCode && link}
      <Kids kids={kids} loadError={loadError} onChanged={reload} onReport={onReport} problem={problem} />
      {!linkCode && link}
      <IPads iPads={iPads} onChanged={reload} problem={problem} />
      <AttachDiary onAdded={reload} problem={problem} />
    </>
  )
}

type Problem = (err: unknown, show: (message: string) => void) => void

/** Approving the code a kid's iPad shows, for one of your kids. Checking the code first claims it. */
function LinkIPad({ initial, kids, onLinked, problem }: { initial: string; kids: Kid[] | null; onLinked: () => void; problem: Problem }) {
  const [code, setCode] = useState(initial)
  const [checked, setChecked] = useState<{ code: string; offered: Offered | null } | null>(null)
  const [pick, setPick] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const check = async (e?: FormEvent) => {
    e?.preventDefault()
    const userCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!userCode) return
    setBusy(true)
    setMessage('')
    try {
      setChecked({ code: userCode, offered: await checkCode(userCode) })
      setPick('')
    } catch (err) {
      problem(err, setMessage)
    } finally {
      setBusy(false)
    }
  }

  // The iPad's own diary comes along, unless it's in another grown-up's account.
  const offered = checked?.offered && checked.offered.status !== 'taken' ? checked.offered : null
  const pickedName = kids?.find((k) => k.id === pick)?.name

  const link = async () => {
    if (!checked || (!offered && !pick)) return
    setBusy(true)
    try {
      await approveCode(checked.code, offered ? undefined : pick)
      setMessage(`Linked to ${offered ? offered.name : pickedName}. The iPad will notice in a few seconds.`)
      setChecked(null)
      setCode('')
      forgetCodeInAddress()
      onLinked()
    } catch (err) {
      problem(err, setMessage)
    } finally {
      setBusy(false)
    }
  }

  const dontLink = async () => {
    if (!checked) return
    setBusy(true)
    await authClient.$fetch('/device/deny', { method: 'POST', body: { userCode: checked.code } }).catch(() => {})
    setBusy(false)
    setChecked(null)
    setCode('')
    forgetCodeInAddress()
    setMessage('Not linked.')
  }

  // Arriving from the iPad's QR code: check it straight away.
  const started = useRef(false)
  useEffect(() => {
    if (initial && !started.current) {
      started.current = true
      void check()
    }
    // Only for the code in the address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="card panel">
      <h2>Link an iPad</h2>
      {checked ? (
        <>
          {checked.offered ? (
            <p>
              The iPad showing <b className="link-code">{checked.code}</b> has {checked.offered.name}'s diary.
            </p>
          ) : (
            <p>
              Link the iPad showing <b className="link-code">{checked.code}</b>.
            </p>
          )}
          {offered?.status === 'free' && (
            <p className="note">
              Linking it adds {offered.name}'s diary to your account. After that, its name and family PIN no longer open it, and any other
              iPad that has it open needs linking too.
            </p>
          )}
          {checked.offered?.status === 'taken' && <p className="note">That diary is in another grown-up's account, so pick one of yours for this iPad.</p>}
          {!offered &&
            (kids && kids.length > 0 ? (
              <>
                <p>Which kid is this iPad for?</p>
                <div className="segmented wrap">
                  {kids.map((kid) => (
                    <button key={kid.id} type="button" className={pick === kid.id ? 'on' : ''} onClick={() => setPick(kid.id)}>
                      {kid.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p>{kids ? 'Add a kid first, below, then link this iPad to them.' : 'Loading your kids…'}</p>
            ))}
          <div className="row">
            <button type="button" className="btn small teal" onClick={link} disabled={busy || (!offered && !pick)}>
              {offered ? `Link it for ${offered.name}` : pickedName ? `Link it for ${pickedName}` : 'Link it'}
            </button>
            <button type="button" className="btn small" onClick={dontLink} disabled={busy}>
              Don't link it
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={check}>
          <p>Type the code the iPad shows.</p>
          <input
            className="text-input small"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-label="Code from the iPad"
          />
          <div className="row">
            <button type="submit" className="btn small teal" disabled={busy}>
              Check the code
            </button>
          </div>
        </form>
      )}
      {message && <p className="note">{message}</p>}
    </section>
  )
}

interface KidsProps {
  kids: Kid[] | null
  loadError: string
  onChanged: () => void
  onReport: (found: { progress: Progress; link: CloudLink }) => void
  problem: Problem
}

function Kids({ kids, loadError, onChanged, onReport, problem }: KidsProps) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState('')

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setMessage('Write their name first.')
    setBusy(true)
    try {
      await addKid(name)
      setMessage(`Added ${name.trim()}. Next, link their iPad.`)
      setName('')
      onChanged()
    } catch (err) {
      problem(err, setMessage)
    } finally {
      setBusy(false)
    }
  }

  const report = async (kid: Kid) => {
    setBusy(true)
    try {
      onReport(await openKid(kid.id))
    } catch (err) {
      problem(err, setMessage)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (kid: Kid) => {
    setBusy(true)
    try {
      await deleteKid(kid.id)
      setMessage(`Deleted ${kid.name}'s diary.`)
      setDeleting('')
      onChanged()
    } catch (err) {
      problem(err, setMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card panel">
      <h2>Your kids</h2>
      {loadError ? (
        <p className="error">{loadError}</p>
      ) : kids === null ? (
        <p>Loading…</p>
      ) : kids.length === 0 ? (
        <p>No kids yet. Add one here, or add a diary you already have.</p>
      ) : (
        <ul className="family-list">
          {kids.map((kid) => (
            <li key={kid.id}>
              <span className="family-name">{kid.name}</span>
              <span className="note">Last saved {timeAgo(kid.updatedAt)}</span>
              {deleting === kid.id ? (
                <>
                  <p>
                    This permanently deletes {kid.name}'s diary, progress, and answers, and unlinks their iPads. It can't be undone.
                  </p>
                  <div className="row">
                    <button type="button" className="btn small" onClick={() => setDeleting('')}>
                      Keep it
                    </button>
                    <button type="button" className="btn small pink" onClick={() => remove(kid)} disabled={busy}>
                      Delete for good
                    </button>
                  </div>
                </>
              ) : (
                <div className="row">
                  <button type="button" className="btn small purple" onClick={() => report(kid)} disabled={busy}>
                    Progress report
                  </button>
                  <button type="button" className="btn small" onClick={() => setDeleting(kid.id)}>
                    Delete…
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="family-add">
        <h3>Add a kid</h3>
        <input
          className="text-input small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="off"
          placeholder="Their name"
          aria-label="New kid's name"
        />
        <div className="row">
          <button type="submit" className="btn small teal" disabled={busy}>
            Add a kid
          </button>
        </div>
      </form>
      {message && <p className="note">{message}</p>}
    </section>
  )
}

function IPads({ iPads, onChanged, problem }: { iPads: LinkedIPad[] | null; onChanged: () => void; problem: Problem }) {
  const [unlinking, setUnlinking] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const label = (d: LinkedIPad) => (d.name ? `${d.name}'s iPad` : 'An iPad with no kid')

  const unlink = async (d: LinkedIPad) => {
    setBusy(true)
    try {
      await unlinkIPad(d.id)
      setMessage(`Unlinked ${label(d)}.`)
      setUnlinking('')
      onChanged()
    } catch (err) {
      problem(err, setMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card panel">
      <h2>Linked iPads</h2>
      {iPads === null ? (
        <p>Loading…</p>
      ) : iPads.length === 0 ? (
        <p className="note">None yet. A kid's iPad shows a code to link it.</p>
      ) : (
        <ul className="family-list">
          {iPads.map((d) => (
            <li key={d.id}>
              <span className="family-name">{label(d)}</span>
              <span className="note">
                Linked {dayLabel(d.linkedAt)} · last used {dayLabel(d.lastSeen)}
              </span>
              {unlinking === d.id ? (
                <>
                  <p>It stops saving online until it's linked again with a new code.</p>
                  <div className="row">
                    <button type="button" className="btn small" onClick={() => setUnlinking('')}>
                      Keep it
                    </button>
                    <button type="button" className="btn small pink" onClick={() => unlink(d)} disabled={busy}>
                      Unlink it
                    </button>
                  </div>
                </>
              ) : (
                <div className="row">
                  <button type="button" className="btn small" onClick={() => setUnlinking(d.id)}>
                    Unlink…
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {message && <p className="note">{message}</p>}
    </section>
  )
}

/** A diary made the old way, with a name and family PIN, brought into this account. */
function AttachDiary({ onAdded, problem }: { onAdded: () => void; problem: Problem }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const attach = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const added = await attachDiary(name, pin)
      setMessage(`Added ${added.name}'s diary to your account.`)
      setName('')
      setPin('')
      onAdded()
    } catch (err) {
      problem(err, setMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card panel">
      <h2>Add a diary you already have</h2>
      <p className="note">
        For a diary made with a name and family PIN. Once it's in your account, the name and PIN no longer open it, and any iPad that has
        it open needs linking.
      </p>
      <form onSubmit={attach} className="family-add">
        <input
          className="text-input small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="off"
          placeholder="Name on the diary"
          aria-label="Name on the diary"
        />
        <input
          className="text-input pin-input small"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder="Family PIN"
          aria-label="Family PIN"
        />
        <div className="row">
          <button type="submit" className="btn small teal" disabled={busy}>
            Add it
          </button>
        </div>
      </form>
      {message && <p className="note">{message}</p>}
    </section>
  )
}

/** Plays the part of a kid's iPad: asks for a code, waits for approval, keeps the session token. */
function TestLink() {
  const [token, setToken] = useState(() => readToken())
  const [linkedTo, setLinkedTo] = useState('')
  const [pending, setPending] = useState<{ userCode: string; url: string } | null>(null)
  const [message, setMessage] = useState('')
  const timer = useRef<number | undefined>(undefined)

  // Who the saved token belongs to and which kid's diary it opens, which also shows it still works.
  useEffect(() => {
    if (!token) return
    let live = true
    const bearer = { Authorization: `Bearer ${token}` }
    authClient.getSession({ fetchOptions: { headers: bearer } }).then(async ({ data }) => {
      if (!live) return
      if (!data?.user) {
        forgetToken()
        setToken('')
        setMessage('The test link had ended.')
        return
      }
      const mine = await fetch(`${API}?op=mine`, { headers: bearer })
        .then((r) => (r.ok ? (r.json() as Promise<{ progress?: { name?: string } }>) : null))
        .catch(() => null)
      if (!live) return
      const kid = mine?.progress?.name
      setLinkedTo(`${data.user.name} (${data.user.email}), ${kid ? `for ${kid}'s diary` : 'with no kid'}`)
    })
    return () => {
      live = false
    }
  }, [token])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const start = async () => {
    setMessage('')
    const { data, error } = await authClient.device.code({ client_id: DEVICE_CLIENT_ID })
    if (error || !data) return setMessage("Couldn't get a code. Try again?")
    setPending({ userCode: data.user_code, url: data.verification_uri_complete })
    let wait = (data.interval ?? 5) * 1000
    const poll = async () => {
      const res = await authClient.device.token({ grant_type: GRANT, device_code: data.device_code, client_id: DEVICE_CLIENT_ID })
      if (res.data?.access_token) {
        saveToken(res.data.access_token)
        setPending(null)
        setToken(res.data.access_token)
        return
      }
      const code = (res.error as { error?: string } | null)?.error
      if (code === 'slow_down') wait += 5000
      else if (code !== 'authorization_pending') {
        setPending(null)
        return setMessage(code === 'access_denied' ? 'It was turned down.' : 'The code ran out. Try again?')
      }
      timer.current = window.setTimeout(() => void poll(), wait)
    }
    timer.current = window.setTimeout(() => void poll(), wait)
  }

  const forget = async () => {
    await authClient.signOut({ fetchOptions: { headers: { Authorization: `Bearer ${token}` } } }).catch(() => {})
    forgetToken()
    setToken('')
    setLinkedTo('')
  }

  return (
    <section className="card panel">
      <h2>Test: link this browser</h2>
      {token ? (
        <>
          <p>This browser is linked to {linkedTo || '…'}.</p>
          <div className="row">
            <button type="button" className="btn small" onClick={forget}>
              Forget the test link
            </button>
          </div>
        </>
      ) : pending ? (
        <>
          <p>
            On your phone, sign in on this page and enter <b className="link-code">{pending.userCode}</b>, or open:
          </p>
          <p className="note">
            <a href={pending.url}>{pending.url}</a>
          </p>
          <p className="note">Waiting for approval…</p>
        </>
      ) : (
        <>
          <p>This does what a kid's iPad will do: it shows a code for a grown-up to approve.</p>
          <div className="row">
            <button type="button" className="btn small purple" onClick={start}>
              Try linking this browser
            </button>
          </div>
        </>
      )}
      {message && <p className="note">{message}</p>}
    </section>
  )
}

function readToken(): string {
  try {
    return localStorage.getItem(TEST_TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveToken(token: string): void {
  try {
    localStorage.setItem(TEST_TOKEN_KEY, token)
  } catch {
    // Storage blocked: the link lasts until the page closes.
  }
}

function forgetToken(): void {
  try {
    localStorage.removeItem(TEST_TOKEN_KEY)
  } catch {
    // Nothing saved.
  }
}
