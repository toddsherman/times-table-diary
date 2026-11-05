/** Colors shared by every drawing in the construction theme. */
export const C = {
  ink: '#1f2328',
  yellow: '#ffc400',
  yellowDark: '#e0a800',
  orange: '#ff7a1a',
  dark: '#3d434a',
  steel: '#b8bec4',
  glass: '#a9dcf7',
  white: '#f4f4f1',
  dirt: '#a0703c',
  concrete: '#c9ccce',
  blue: '#1f5fa8',
} as const

export const line = { stroke: C.ink, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
export const thin = { stroke: C.ink, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

