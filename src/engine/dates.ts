const DAY_MS = 86_400_000

/** The local calendar day as an integer, so "today" follows the iPad's clock rather than UTC. */
export function dayNumber(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS)
}

export function dateFromDay(day: number): Date {
  const utc = new Date(day * DAY_MS)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}
