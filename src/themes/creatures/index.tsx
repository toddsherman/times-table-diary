import type { Theme } from '../types'
import './creatures.css'
import { milestones } from './milestones'
import { Stamp } from './stamps'
import { BurstShape, Collection, Cover, FastIcon, HomeShelf, JournalPage, Mark } from './views'
import { LEVELS, PARTS, STAMP_NAMES, VOICE, WORDS } from './words'

/**
 * Explorers hatch and raise a creature for every times table, keep a field journal, and collect a
 * place stamp for each finished expedition. All creatures and names are original.
 */
export const creatures: Theme = {
  id: 'creatures',
  name: 'Creatures',
  blurb: 'Hatch a creature for every table',
  themeColor: '#3fae49',
  words: WORDS,
  levels: LEVELS,
  parts: PARTS,
  voice: VOICE,
  rewardNames: STAMP_NAMES,
  Reward: ({ id, size, className }) => <Stamp id={id} size={size} className={className} />,
  Cover,
  FastIcon,
  BurstShape,
  Mark,
  Page: JournalPage,
  Collection,
  HomeShelf,
  milestones,
}
