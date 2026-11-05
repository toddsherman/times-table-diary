import type { Theme } from '../types'
import './construction.css'
import { dumpTruck, excavator, MACHINE_NAMES } from './fleet'
import { Cone, FastSign, Machine, SignBurst, Star } from './machines'
import { milestones } from './milestones'
import { SiteReport } from './SiteReport'
import { SiteSign, Tower, Yard } from './tower'
import { levels, parts, voice, words } from './words'

/** A job site: a tower of facts goes up floor by floor, and every finished shift earns a machine. */
export const construction: Theme = {
  id: 'construction',
  // The soft hyphen lets the long name break in narrow picker tiles; it's invisible otherwise.
  name: 'Construction',
  blurb: 'Big machines build a tower of facts',
  themeColor: '#ffc400',
  words,
  levels,
  parts,
  voice,
  rewardNames: MACHINE_NAMES,
  Reward: ({ id, size, className }) => <Machine id={id} size={size} className={className} />,
  Cover: () => (
    <>
      <svg className="sticker machine" viewBox="0 0 100 100" width={76} height={76} aria-hidden="true">
        {excavator}
      </svg>
      <Cone size={48} />
      <svg className="sticker machine" viewBox="0 0 100 100" width={70} height={70} aria-hidden="true">
        {dumpTruck}
      </svg>
    </>
  ),
  FastIcon: () => <FastSign size={30} />,
  BurstShape: () => <SignBurst />,
  Mark: ({ size }) => <Star size={size} />,
  Page: SiteReport,
  Collection: SiteSign,
  Grid: Tower,
  HomeShelf: Yard,
  milestones,
}
