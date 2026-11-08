import { createAuthClient } from 'better-auth/client'
import { deviceAuthorizationClient } from 'better-auth/client/plugins'

/** Grown-up sign-in (server/auth.ts), at the app's own address so its cookie belongs to this site. */
export const authClient = createAuthClient({
  baseURL: `${location.origin}${import.meta.env.BASE_URL}api/auth`,
  plugins: [deviceAuthorizationClient()],
})

/** Must match DEVICE_CLIENT_ID in server/auth.ts. */
export const DEVICE_CLIENT_ID = 'times-table-diary'

export const grownUpsUrl = (extra = '') => `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}?grownups${extra}`
