import type { Progress } from '../../engine/types'
import type { Milestone } from '../types'
import { PuppyArt } from './pup-art'
import { PUPS, pupStage, type Pup } from './pups'

function milestoneFor(pup: Pup, stage: number): Milestone {
  const { table: t, name } = pup
  const art = <PuppyArt table={t} stage={stage} size={150} fit />
  switch (stage) {
    case 1:
      return {
        key: `pup-${t}-s1`,
        title: `${name} came home!`,
        text: `Say hi to ${name}, your ${t}s puppy!`,
        entryLine: `${name} came home! ${name} is my ${t}s puppy.`,
        art,
      }
    case 2:
      return {
        key: `pup-${t}-s2`,
        title: `${name} learned a trick!`,
        text: `${name} can sit and shake a paw! Half of your ${t}s facts are Good dogs.`,
        entryLine: `${name} learned to sit and shake a paw! Good dog, ${name}!`,
        art,
      }
    case 3:
      return {
        key: `pup-${t}-s3`,
        title: `${name} graduated!`,
        text: `Every ${t}s fact is a Good dog, so ${name} gets a collar and a name tag!`,
        entryLine: `${name} graduated from puppy class and got a shiny name tag!`,
        art,
      }
    default:
      return {
        key: `pup-${t}-s4`,
        title: `${name} is a champion!`,
        text: `Every ${t}s fact is a Top dog. ${name} won a blue ribbon!`,
        entryLine: `${name} won a CHAMPION RIBBON. Every ${t}s fact is a Top dog!`,
        art,
      }
  }
}

/**
 * Every homecoming, trick, graduation and ribbon so far, one per puppy per stage. Earlier stages
 * stay listed, so a puppy that slips back a stage and climbs again isn't celebrated twice in a row.
 */
export function milestones(p: Progress): Milestone[] {
  const out: Milestone[] = []
  for (const pup of PUPS) {
    const stage = pupStage(p, pup.table)
    for (let s = 1; s <= stage; s++) out.push(milestoneFor(pup, s))
  }
  return out
}
