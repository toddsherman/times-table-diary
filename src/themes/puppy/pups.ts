import { factId, FACTORS } from '../../engine/facts'
import type { Progress } from '../../engine/types'
import type { StickerId } from '../../stickers'
import { tableColoredIn, tableStage } from '../tables'

export const INK = '#4a3226'
export const RED = '#dc3f33'
export const GOLD = '#ffc93c'
export const BLUE = '#3a8de0'

export type Ears = 'floppy' | 'long' | 'pointy' | 'folded' | 'round' | 'mixed'
export type Marking = 'patch' | 'spots' | 'blaze' | 'mask' | 'brows' | 'cheeks' | 'tuft' | 'fluffy' | 'saddle' | 'socks' | 'beard'

/** One times table's puppy. Every puppy is an original design with an invented name. */
export interface Pup {
  table: number
  name: string
  /** Main fur, darker fur (spots, patches), and light fur (muzzle, chest). */
  coat: string
  shade: string
  light: string
  /** The ears' color, when it isn't `shade`. */
  ear?: string
  ears: Ears
  marks: readonly Marking[]
  tail: 'wag' | 'curl' | 'fluff'
  /** The iris, for puppies with light eyes. */
  eye?: string
  /** Its bed, and the roof of its kennel on the puppy yard. */
  bed: string
}

export const PUPS: readonly Pup[] = [
  { table: 1, name: 'Biscuit', coat: '#eab36c', shade: '#c4803f', light: '#fff4df', ears: 'floppy', marks: [], tail: 'wag', bed: '#e4574b' },
  { table: 2, name: 'Pepper', coat: '#fffaf2', shade: '#3e2e28', light: '#ffffff', ears: 'floppy', marks: ['spots', 'patch'], tail: 'wag', bed: '#4f9be0' },
  { table: 3, name: 'Noodle', coat: '#c56a3c', shade: '#8f4524', light: '#f7cba0', ears: 'long', marks: [], tail: 'wag', bed: '#f2b631' },
  { table: 4, name: 'Maple', coat: '#e5843a', shade: '#b65d22', light: '#fff6ea', ears: 'pointy', marks: ['cheeks'], tail: 'curl', bed: '#58b45a' },
  { table: 5, name: 'Waffles', coat: '#f2dcb2', shade: '#d6b27c', light: '#fff9ec', ears: 'round', marks: ['fluffy', 'tuft'], tail: 'fluff', bed: '#ef7fb0' },
  { table: 6, name: 'Pickle', coat: '#b3bac3', shade: '#7b8590', light: '#f3f5f7', ears: 'folded', marks: ['beard', 'brows', 'socks'], tail: 'wag', bed: '#f08a3c' },
  { table: 7, name: 'Bean', coat: '#3d3330', shade: '#251d1a', light: '#d39a5b', ears: 'folded', marks: ['brows'], tail: 'wag', bed: '#2fb3a5' },
  { table: 8, name: 'Ziggy', coat: '#7f8996', shade: '#525b67', light: '#ffffff', ears: 'pointy', marks: ['mask'], tail: 'curl', eye: '#4da3e8', bed: '#8a6be0' },
  { table: 9, name: 'Cocoa', coat: '#7c4a2f', shade: '#57311c', light: '#cf9a6c', ears: 'floppy', marks: ['tuft'], tail: 'wag', bed: '#7fd0c4' },
  { table: 10, name: 'Mochi', coat: '#ffffff', shade: '#f1d6cc', light: '#ffffff', ear: '#fff4ef', ears: 'round', marks: ['fluffy', 'cheeks'], tail: 'fluff', bed: '#b79be8' },
  { table: 11, name: 'Pip', coat: '#e8caa1', shade: '#6e4c36', light: '#fff6e8', ear: '#b88a5f', ears: 'mixed', marks: ['patch'], tail: 'wag', bed: '#3f86d6' },
  { table: 12, name: 'Clover', coat: '#cb8b4c', shade: '#3b2b23', light: '#ffffff', ear: '#9c6230', ears: 'floppy', marks: ['blaze', 'saddle'], tail: 'wag', bed: '#a3cf45' },
]

export const pupFor = (table: number): Pup => PUPS[table - 1]

/**
 * A table's puppy: 0 its bed is waiting, 1 it came home, 2 it learned a trick, 3 it graduated
 * (collar and name tag), 4 champion. Like tableStage, except a puppy only comes home once a fact of
 * its table has really been answered: a new diary starts its ×1 and ×10 facts inked, which
 * tableStage counts as met, and every puppy would arrive before the first question.
 */
export function pupStage(p: Progress, table: number): number {
  const stage = tableStage(p, table)
  if (stage >= 2) return stage
  return FACTORS.some((b) => p.facts[factId(table, b)].seen > 0) ? 1 : 0
}

export const STAGE_LABELS = ['Bed is ready', 'New puppy', 'Learning tricks', 'Graduated', 'Champion'] as const

const topDogs = (p: Progress, table: number) => FACTORS.filter((b) => p.facts[factId(table, b)].level >= 4).length

/** What the puppy needs next, and how far along it is (0–1). */
export function nextStep(p: Progress, pup: Pup, stage: number): { text: string; done: number } {
  const t = pup.table
  const good = tableColoredIn(p, t)
  if (stage === 0) return { text: `Answer a ${t}s fact and ${pup.name} comes home!`, done: 0 }
  if (stage === 1) return { text: `${good} of 6 Good dogs to learn a trick`, done: good / 6 }
  if (stage === 2) return { text: `${good} of 12 Good dogs to graduate`, done: good / 12 }
  if (stage === 3) {
    const top = topDogs(p, t)
    return { text: `${top} of 12 Top dogs to be a champion`, done: top / 12 }
  }
  return { text: 'Every fact is a Top dog!', done: 1 }
}

/** Each finished page earns a toy or treat for the puppies. One per shared reward slot. */
export const REWARD_NAMES: Record<StickerId, string> = {
  star: 'Puppy pal',
  heart: 'Tennis ball',
  crown: 'Doghouse',
  bolt: 'Flying disc',
  cupcake: 'Pupcake',
  rainbow: 'Rope toy',
  notes: 'Squeaky duck',
  icecream: 'Food bowl',
  flower: 'Bandana',
  cool: 'Collar and tag',
  cat: 'Chew bone',
  balloon: 'Treat jar',
}
