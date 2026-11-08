import { deviceOverreach, publicRequest, type Auth, type AuthEnv } from '../server/auth.js'
import { productionAuth } from '../server/production.js'

/**
 * Grown-up sign-in (see server/auth.ts). The app calls it as
 * www.todd.sh/timesTableDiary/App/api/auth/…; todd.sh forwards those requests here, and vercel.json
 * rewrites them to this function, which still sees the original address.
 *
 * Until BETTER_AUTH_SECRET is set it answers 503, so the API can go live before sign-in is set up.
 */

const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export function createAuthHandler(getAuth: () => Promise<Auth | null>, env: AuthEnv) {
  return async function handle(request: Request): Promise<Response> {
    try {
      const auth = await getAuth()
      if (!auth) return json({ error: 'not_ready' }, 503)
      const req = await publicRequest(request, env)
      // A kid's iPad can check and end its own session, and nothing else.
      if (await deviceOverreach(auth, req)) return json({ error: 'grown_up_only' }, 403)
      const response = await auth.handler(req)
      if (!req.headers.has('authorization')) return response
      // A request with an iPad's token never changes the browser's cookies. Otherwise checking a
      // token that had ended would sign out a grown-up using the same browser, and a live one could
      // replace their cookie with the iPad's.
      const headers = new Headers(response.headers)
      headers.delete('set-cookie')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    } catch (err) {
      console.error(err)
      return json({ error: 'server' }, 500)
    }
  }
}

export default {
  fetch: createAuthHandler(productionAuth, process.env as AuthEnv),
}
