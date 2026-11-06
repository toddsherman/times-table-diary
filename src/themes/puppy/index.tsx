import { diary } from '../diary'
import type { Theme } from '../types'

/** A placeholder until the theme is drawn: the diary under a new name. */
export const puppy: Theme = {
  ...diary,
  id: 'puppy',
  name: 'Puppies',
  blurb: 'Raise a puppy for every times table',
}
