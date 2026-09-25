import { dateFromDay } from './engine/dates'

export const shortDay = (day: number) => dateFromDay(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export const longDay = (day: number) => dateFromDay(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

/** "just now", "5 minutes ago", "today at 3:05 PM", or a date. */
export function timeAgo(at: number, now = Date.now()): string {
  const minutes = Math.floor((now - at) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const then = new Date(at)
  const time = then.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return then.toDateString() === new Date(now).toDateString() ? `today at ${time}` : `${then.toLocaleDateString()} at ${time}`
}
