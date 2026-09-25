// Tiny synthesized sound effects, so there are no audio files to load or cache.

let ctx: AudioContext | null = null
let enabled = true

export function setSoundOn(on: boolean): void {
  enabled = on
}

/** Safari only allows audio after a tap, so this runs on every tap until audio is running. */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function tone(freq: number, start: number, length: number, type: OscillatorType = 'triangle', volume = 0.18): void {
  if (!enabled || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + length + 0.05)
}

export const sfx = {
  fast() {
    tone(988, 0, 0.12)
    tone(1319, 0.09, 0.22)
  },
  correct() {
    tone(784, 0, 0.2)
  },
  wrong() {
    tone(262, 0, 0.22, 'sine', 0.14)
    tone(220, 0.14, 0.3, 'sine', 0.12)
  },
  fanfare() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3))
    tone(1319, 0.5, 0.5)
  },
}
