const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path d="M6 6.5 18 17.5M17.5 6 6.5 18" {...stroke} />
    </svg>
  )
}

export function BackspaceIcon() {
  return (
    <svg viewBox="0 0 32 24" width="44" height="33" aria-hidden="true">
      <path d="M10 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H10L2 12Z" {...stroke} />
      <path d="M15 8l8 8M23 8l-8 8" {...stroke} />
    </svg>
  )
}

export function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M15 5 8 12l7 7" {...stroke} />
    </svg>
  )
}

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" {...stroke} strokeWidth={2} />
      <path
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
        {...stroke}
        strokeWidth={2}
      />
    </svg>
  )
}

export function Sparkle({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
      <path d="M10 1c1 5 4 8 9 9-5 1-8 4-9 9-1-5-4-8-9-9 5-1 8-4 9-9Z" fill="currentColor" />
    </svg>
  )
}
