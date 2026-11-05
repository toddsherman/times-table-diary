import { diary } from '../diary'
import type { Theme } from '../types'
import './bricks.css'

/** Placeholder: the diary's words and art under a new name, until the theme is designed. */
export const bricks: Theme = {
  ...diary,
  id: 'bricks',
  name: 'Bricks',
  blurb: 'Snap facts together, brick by brick',
  themeColor: '#e3000b',
  words: { ...diary.words, appTitle: 'Times Table Bricks', pronouns: undefined },
}
