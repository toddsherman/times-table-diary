import { diary } from '../diary'
import type { Theme } from '../types'

/** A placeholder until the theme is drawn: the diary under a new name. */
export const princess: Theme = {
  ...diary,
  id: 'princess',
  name: 'Princess',
  blurb: 'Rule the kingdom and fill your crowns',
}
