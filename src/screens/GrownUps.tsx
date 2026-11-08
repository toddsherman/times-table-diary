import { useEffect, useRef, useState, type FormEvent } from 'react'
import { authClient, DEVICE_CLIENT_ID, grownUpsUrl } from '../auth-client'
import { TopBar } from '../components/TopBar'

// The grown-up page, at /timesTableDiary/App?grownups. Nothing links here yet: for now it's where
// sign-in gets tried out. Grown-ups sign in with Google or Apple, then approve the code a kid's
// iPad shows. "Try linking this browser" plays the iPad's part, so the whole loop can be tested.

interface User {
  id: string
  name: string
  email: string
}

const TEST_TOKEN_KEY = 'times-table-diary-link-test'
const GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

const goToApp = () => location.assign(import.meta.env.BASE_URL.replace(/\/$/, ''))

export function GrownUps() {
  const params = new URLSearchParams(location.search)
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [error, setError] = useState(params.get('error') ? "Sign-in didn't finish. Try again?" : '')

  useEffect(() => {
    authClient
      .getSession()
      .then(({ data }) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
  }, [])

  const signIn = async (provider: 'google' | 'apple') => {
    setError('')
    // Come back here, keeping any link code that brought you.
    const back = grownUpsUrl(params.get('user_code') ? `=link&user_code=${encodeURIComponent(params.get('user_code')!)}` : '')
    const { error: err } = await authClient.signIn.social({ provider, callbackURL: back, errorCallbackURL: grownUpsUrl('&error=1') })
    if (!err) return
    const name = provider === 'google' ? 'Google' : 'Apple'
    setError(err.status === 404 ? `${name} sign-in isn't set up yet.` : `Couldn't start signing in with ${name}. Try again?`)
  }

  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
  }

  return (
    <div className="screen settings grown-up-page">
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
            <p>Sign in to look after your kids' diaries.</p>
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

      {user && <ApproveCode initial={params.get('user_code') ?? ''} />}
      {user === null && params.get('user_code') && (
        <section className="card panel">
          <h2>Link an iPad</h2>
          <p>Sign in first, then you can approve code {params.get('user_code')}.</p>
        </section>
      )}

      <TestLink />
    </div>
  )
}

/** Approving the code an iPad shows. Checking the code first claims it for this account. */
function ApproveCode({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial)
  const [checked, setChecked] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const clean = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '')

  const check = async (e?: FormEvent) => {
    e?.preventDefault()
    const userCode = clean(code)
    if (!userCode) return
    setBusy(true)
    setMessage('')
    const { error } = await authClient.$fetch('/device', { method: 'GET', query: { user_code: userCode } })
    setBusy(false)
    if (error) return setMessage("That code didn't work. Check it against the iPad, or ask the iPad for a new one.")
    setChecked(userCode)
  }

  const answer = async (approve: boolean) => {
    setBusy(true)
    const { error } = await authClient.$fetch(approve ? '/device/approve' : '/device/deny', { method: 'POST', body: { userCode: checked } })
    setBusy(false)
    setChecked('')
    setCode('')
    setMessage(error ? 'Something went wrong. Ask the iPad for a new code.' : approve ? 'Linked. The iPad will notice in a few seconds.' : 'Not linked.')
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
          <p>
            Link the iPad showing <b className="link-code">{checked}</b> to your account?
          </p>
          <div className="row">
            <button type="button" className="btn small teal" onClick={() => answer(true)} disabled={busy}>
              Link it
            </button>
            <button type="button" className="btn small" onClick={() => answer(false)} disabled={busy}>
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

/** Plays the part of a kid's iPad: asks for a code, waits for approval, keeps the session token. */
function TestLink() {
  const [token, setToken] = useState(() => readToken())
  const [linkedTo, setLinkedTo] = useState('')
  const [pending, setPending] = useState<{ userCode: string; url: string } | null>(null)
  const [message, setMessage] = useState('')
  const timer = useRef<number | undefined>(undefined)

  // Who the saved token belongs to, which also shows whether it still works.
  useEffect(() => {
    if (!token) return
    let live = true
    authClient.getSession({ fetchOptions: { headers: { Authorization: `Bearer ${token}` } } }).then(({ data }) => {
      if (!live) return
      if (data?.user) return setLinkedTo(`${data.user.name} (${data.user.email})`)
      forgetToken()
      setToken('')
      setMessage('The test link had ended.')
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
