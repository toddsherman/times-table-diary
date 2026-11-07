// Small, optional motion shared by every theme. The movement itself lives in each theme's CSS, inside
// `@media (prefers-reduced-motion: no-preference)`, so a device set to reduce motion sees none of it.
//
// Two hooks for that CSS:
// - Tap: mark art with `data-tap`, or a container with `data-tap-each` to make each of its children
//   tappable. Both get a pointer cursor, which iPadOS also needs before it sends the tap. A tap adds
//   the class `tapped` (restarting the animation if it's mid-way), and the class comes off when that
//   animation ends. Style `.tapped`. The tap still does whatever else it did.
// - Fresh: put `data-fresh` on something that grew since the screen was last shown (see
//   useNewSince), or the class `fresh` on a Reward, which only takes a className. Style it with a
//   one-time animation; the attribute or class comes off when that ends, so a re-render or a later
//   tap never replays it. Write `.tapped` rules after the fresh ones so a tap wins.

import { type CSSProperties, useEffect, useState } from 'react'
import type { Progress } from './engine/types'

export function installTapMotion(): void {
  // A click, not a pointerdown, so a finger that starts a scroll on some art doesn't set it off.
  document.addEventListener('click', (e) => {
    const el = tapTarget(e.target)
    if (!el) return
    el.classList.remove('tapped')
    // Reading layout here restarts the animation when the class goes straight back on.
    void el.getBoundingClientRect()
    el.classList.add('tapped')
    tapAnimations.set(el, getComputedStyle(el).animationName.split(', '))
    window.clearTimeout(timers.get(el))
    // A fallback for art with no tap animation, or none under reduced motion.
    timers.set(
      el,
      window.setTimeout(() => el.classList.remove('tapped'), 2500),
    )
  })
  const done = (e: AnimationEvent) => {
    const el = e.target
    if (!(el instanceof Element)) return
    if (el.classList.contains('tapped') && (tapAnimations.get(el) ?? []).includes(e.animationName)) {
      // A quick second tap cancels the first run on its way to restarting it; only a finish counts.
      if (e.type === 'animationend') el.classList.remove('tapped')
    } else if (el.hasAttribute('data-fresh')) el.removeAttribute('data-fresh')
    else if (el.classList.contains('fresh')) el.classList.remove('fresh')
  }
  document.addEventListener('animationend', done)
  document.addEventListener('animationcancel', done)
}

const timers = new WeakMap<Element, number>()
const tapAnimations = new WeakMap<Element, string[]>()

function tapTarget(target: EventTarget | null): Element | null {
  for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
    if (el.hasAttribute('data-tap')) return el
    if (el.parentElement?.hasAttribute('data-tap-each')) return el
  }
  return null
}

const SEEN_PREFIX = 'times-table-seen:'

/**
 * Which of `values` went up since this screen was last shown on this device: a reward collected,
 * a fact colored in, a creature grown. Those get one small celebration (`data-fresh`) the next time
 * the screen opens, and then they're old news.
 *
 * `what` names the screen part, e.g. "shelf". Values are compared key by key; a key that wasn't
 * there before counts as up from 0. The first time ever, nothing is new. The snapshot lives in
 * localStorage, per player and theme, and never leaves the device.
 */
export function useNewSince(progress: Progress, what: string, values: Record<string, number>): ReadonlySet<string> {
  const key = `${SEEN_PREFIX}${progress.name}:${progress.settings.theme ?? 'diary'}:${what}`
  const [fresh] = useState(() => {
    const before = readSeen(key)
    if (!before) return new Set<string>()
    return new Set(Object.keys(values).filter((k) => values[k] > (before[k] ?? 0)))
  })
  const snapshot = JSON.stringify(values)
  useEffect(() => {
    try {
      localStorage.setItem(key, snapshot)
    } catch {
      // Storage full or blocked: the celebration just shows again next time.
    }
  }, [key, snapshot])
  return fresh
}

/** `data-fresh` and a stagger index for the nth fresh thing on screen, or nothing. */
export function freshProps(fresh: boolean, order = 0): { 'data-fresh'?: ''; style?: CSSProperties } {
  return fresh ? { 'data-fresh': '', style: { '--fresh-i': order } as CSSProperties } : {}
}

function readSeen(key: string): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : null
  } catch {
    return null
  }
}
