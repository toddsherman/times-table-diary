import '@fontsource/sniglet/latin-800.css'
import type { Theme } from '../types'
import { BurstShape, Cover, FastIcon, Mark } from './bits'
import { milestones } from './milestones'
import './puppy.css'
import { REWARD_NAMES } from './pups'
import { PuppyReward } from './rewards'
import { Collection, HomeShelf, ScrapbookPage } from './views'
import { levels, parts, voice, words } from './words'

/**
 * A sunny backyard puppy school: a puppy for every times table comes home, learns tricks,
 * graduates and becomes a champion, and every finished page earns the puppies a toy or treat.
 * All puppies and names are original.
 */
export const puppy: Theme = {
  id: 'puppy',
  name: 'Puppies',
  blurb: 'Raise a puppy for every times table',
  themeColor: '#7cc45a',
  words,
  levels,
  parts,
  voice,
  rewardNames: REWARD_NAMES,
  Reward: PuppyReward,
  Cover,
  FastIcon,
  BurstShape,
  Mark,
  Page: ScrapbookPage,
  Collection,
  HomeShelf,
  milestones,
}
