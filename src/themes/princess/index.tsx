import '@fontsource/cherry-swash/latin-700.css'
import '@fontsource/quicksand/latin-600.css'
import '@fontsource/quicksand/latin-700.css'
import type { Theme } from '../types'
import { PrincessCover, PrincessMark, PrincessReward, RoyalRosette, ShootingStar } from './art'
import { CrownRoom, GemGrid, Treasury } from './crowns'
import { crownMilestones } from './milestones'
import { REWARD_NAMES } from './palette'
import './princess.css'
import { RoyalLetter } from './RoyalLetter'
import { levels, parts, voice, words } from './words'

/** A storybook kingdom: a crown for every times table, a gem for every fact, and royal letters home. */
export const princess: Theme = {
  id: 'princess',
  name: 'Princess',
  blurb: 'Rule the kingdom and fill your crowns',
  themeColor: '#6a3fb0',
  words,
  levels,
  parts,
  voice,
  rewardNames: REWARD_NAMES,
  Reward: PrincessReward,
  Cover: PrincessCover,
  FastIcon: () => <ShootingStar size={30} />,
  BurstShape: RoyalRosette,
  Mark: PrincessMark,
  Page: RoyalLetter,
  Collection: CrownRoom,
  Grid: GemGrid,
  HomeShelf: Treasury,
  milestones: crownMilestones,
}
