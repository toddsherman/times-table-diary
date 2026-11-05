import type { Theme } from '../types'
import { InkSplash, NinjaCover, NinjaMark, NinjaReward, ThrowingStar } from './art'
import { BeltRack } from './belts'
import { NINJA_LEVELS, NINJA_PARTS, NINJA_VOICE, NINJA_WORDS } from './copy'
import { beltMilestones } from './milestones'
import './ninja.css'
import { REWARD_NAMES } from './palette'
import { ScrollPage } from './ScrollPage'

/** A dojo at night: rice-paper cards, belts for every fact and table, and training scrolls. */
export const ninja: Theme = {
  id: 'ninja',
  name: 'Ninja',
  blurb: 'Train hard and earn your belts',
  themeColor: '#1b1f3b',
  words: NINJA_WORDS,
  levels: NINJA_LEVELS,
  parts: NINJA_PARTS,
  voice: NINJA_VOICE,
  rewardNames: REWARD_NAMES,
  Reward: NinjaReward,
  Cover: NinjaCover,
  FastIcon: () => <ThrowingStar size={30} />,
  Mark: NinjaMark,
  BurstShape: InkSplash,
  Page: ScrollPage,
  Collection: BeltRack,
  milestones: beltMilestones,
}
