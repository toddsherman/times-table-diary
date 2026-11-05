/** The twelve creature lines, one per times table. Every name and design here is original. */

export type Element = 'rock' | 'leaf' | 'water' | 'fire' | 'spark' | 'ice' | 'wind' | 'bloom' | 'crystal' | 'light' | 'shadow' | 'star'

export interface Palette {
  /** Body color. */
  main: string
  /** Feet, ears and other darker parts. */
  dark: string
  /** Belly and highlights. */
  light: string
  /** The element's own color: flames, leaves, crystals… */
  accent: string
  /** A second element color. */
  accent2: string
}

export interface CreatureLine {
  table: number
  element: Element
  /** "fire", as said in a sentence. */
  kind: string
  /** Baby, evolved, and final names. */
  names: [string, string, string]
  colors: Palette
}

export const LINES: readonly CreatureLine[] = [
  {
    table: 1,
    element: 'rock',
    kind: 'rock',
    names: ['Pebbo', 'Cobblot', 'Craggadon'],
    colors: { main: '#c4ab90', dark: '#8a735d', light: '#efe3d2', accent: '#a3a0b8', accent2: '#7b7893' },
  },
  {
    table: 2,
    element: 'leaf',
    kind: 'leaf',
    names: ['Sprigby', 'Fernhop', 'Grovelope'],
    colors: { main: '#8fd862', dark: '#4c9e3d', light: '#e4f8cb', accent: '#5cbf45', accent2: '#ffd84d' },
  },
  {
    table: 3,
    element: 'water',
    kind: 'water',
    names: ['Dewdrip', 'Ripplefin', 'Tidalora'],
    colors: { main: '#5cbcff', dark: '#2f80d4', light: '#d6f0ff', accent: '#a4e8ff', accent2: '#ffffff' },
  },
  {
    table: 4,
    element: 'fire',
    kind: 'fire',
    names: ['Embit', 'Cindrix', 'Blazemane'],
    colors: { main: '#ff8d45', dark: '#d65520', light: '#ffe2bd', accent: '#ffcf3d', accent2: '#ff5a3d' },
  },
  {
    table: 5,
    element: 'spark',
    kind: 'spark',
    names: ['Fizzwick', 'Voltwing', 'Thundrowl'],
    colors: { main: '#8c6eff', dark: '#5a40d4', light: '#e8e0ff', accent: '#ffe14d', accent2: '#ffffff' },
  },
  {
    table: 6,
    element: 'ice',
    kind: 'ice',
    names: ['Frostlet', 'Glacilynx', 'Aurorynx'],
    colors: { main: '#c6eeff', dark: '#76bce6', light: '#ffffff', accent: '#e9fbff', accent2: '#b9a4ff' },
  },
  {
    table: 7,
    element: 'wind',
    kind: 'wind',
    names: ['Breezle', 'Gustling', 'Zephyroc'],
    colors: { main: '#f5f4ff', dark: '#b2a6ea', light: '#ffffff', accent: '#9fe2ff', accent2: '#d8d1ff' },
  },
  {
    table: 8,
    element: 'bloom',
    kind: 'flower',
    names: ['Buddle', 'Blossoo', 'Bloomaria'],
    colors: { main: '#ffa0cd', dark: '#e0609c', light: '#ffe6f2', accent: '#fff3f8', accent2: '#ff6fae' },
  },
  {
    table: 9,
    element: 'crystal',
    kind: 'crystal',
    names: ['Shardlet', 'Gemadillo', 'Prismadon'],
    colors: { main: '#43cfc0', dark: '#1f8d85', light: '#cafff7', accent: '#e2fbff', accent2: '#b98cff' },
  },
  {
    table: 10,
    element: 'light',
    kind: 'sunshine',
    names: ['Glimby', 'Beamlet', 'Solstara'],
    colors: { main: '#ffd94f', dark: '#e0a300', light: '#fff7cf', accent: '#ffae2b', accent2: '#ff7a2b' },
  },
  {
    table: 11,
    element: 'shadow',
    kind: 'shadow',
    names: ['Shadeling', 'Duskpaw', 'Midnyx'],
    colors: { main: '#5b4cb2', dark: '#2f2776', light: '#dcd6ff', accent: '#ffe9a3', accent2: '#9d92e6' },
  },
  {
    table: 12,
    element: 'star',
    kind: 'star',
    names: ['Twinklet', 'Starpup', 'Cosmora'],
    colors: { main: '#3a68c9', dark: '#203f8f', light: '#e2eaff', accent: '#ffe14d', accent2: '#9fb9ff' },
  },
]

export const lineFor = (table: number): CreatureLine => LINES[table - 1]

/** The name a creature goes by at a stage (0 egg, 1–3 forms, 4 shiny final form). */
export function creatureName(line: CreatureLine, stage: number): string {
  if (stage <= 0) return `${line.names[0]} egg`
  return line.names[Math.min(stage, 3) - 1]
}

export const STAGE_LABELS = ['Egg', 'Baby', 'Evolved', 'Final form', 'Shiny!'] as const
