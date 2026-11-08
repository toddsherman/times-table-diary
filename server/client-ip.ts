import { createHash, timingSafeEqual } from 'node:crypto'

export function sameSecret(given: string | null, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return given !== null && timingSafeEqual(digest(given), digest(expected))
}

/**
 * Who's asking, for rate limits. Requests from www.todd.sh arrive from todd.sh's route handler,
 * so it passes the visitor's address along, and it's believed only with the proxy key.
 */
export function clientIp(request: Request, proxyKey: string | undefined): string {
  const visitor = request.headers.get('x-diary-client-ip')
  if (visitor && proxyKey && sameSecret(request.headers.get('x-diary-proxy-key'), proxyKey)) return visitor
  return request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
