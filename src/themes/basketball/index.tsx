import '@fontsource/graduate/latin-400.css'
import '@fontsource/nunito/latin-600.css'
import type { Theme } from '../types'
import { Cover, FireBall, Gear, MiniBall, ScoreboardBurst } from './art'
import './basketball.css'
import { Arena, ShotCharts } from './court'
import { GameRecap } from './GameRecap'
import { milestones } from './milestones'
import { REWARD_NAMES } from './palette'
import { levels, parts, voice, words } from './words'

/** An indoor gym: maple hardwood, navy and orange, a shot chart for every table and banners in the rafters. */
export const basketball: Theme = {
  id: 'basketball',
  name: 'Basketball',
  blurb: 'Shoot hoops and win the season',
  themeColor: '#1b2a4e',
  words,
  levels,
  parts,
  voice,
  rewardNames: REWARD_NAMES,
  Reward: ({ id, size, className }) => <Gear id={id} size={size} className={className} />,
  Cover,
  FastIcon: () => <FireBall size={30} />,
  BurstShape: ScoreboardBurst,
  Mark: ({ size }) => <MiniBall size={size} />,
  Page: GameRecap,
  Collection: ShotCharts,
  HomeShelf: Arena,
  milestones,
}
