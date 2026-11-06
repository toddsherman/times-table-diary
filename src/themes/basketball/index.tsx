import { diary } from '../diary'
import type { Theme } from '../types'

/** A placeholder until the theme is drawn: the diary under a new name. */
export const basketball: Theme = {
  ...diary,
  id: 'basketball',
  name: 'Basketball',
  blurb: 'Shoot hoops and win the season',
}
