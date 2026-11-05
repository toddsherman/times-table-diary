import { diary } from '../diary'
import type { Theme } from '../types'
import './ninja.css'

/** Placeholder: the diary's words and art under a new name, until the theme is designed. */
export const ninja: Theme = {
  ...diary,
  id: 'ninja',
  name: 'Ninja',
  blurb: 'Train hard and earn your belts',
  themeColor: '#1f2346',
  words: { ...diary.words, appTitle: 'Times Table Dojo', pronouns: undefined },
}
