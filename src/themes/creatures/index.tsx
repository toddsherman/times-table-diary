import { diary } from '../diary'
import type { Theme } from '../types'
import './creatures.css'

/** Placeholder: the diary's words and art under a new name, until the theme is designed. */
export const creatures: Theme = {
  ...diary,
  id: 'creatures',
  name: 'Creatures',
  blurb: 'Hatch and raise a creature for every table',
  themeColor: '#3fae49',
  words: { ...diary.words, appTitle: 'Times Table Creatures', pronouns: undefined },
}
