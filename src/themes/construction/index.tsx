import { diary } from '../diary'
import type { Theme } from '../types'
import './construction.css'

/** Placeholder: the diary's words and art under a new name, until the theme is designed. */
export const construction: Theme = {
  ...diary,
  id: 'construction',
  name: 'Construction',
  blurb: 'Big machines build a tower of facts',
  themeColor: '#ffc400',
  words: { ...diary.words, appTitle: 'Times Table Tower', pronouns: undefined },
}
