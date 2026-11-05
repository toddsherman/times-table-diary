import type { ReactNode } from 'react'
import type { DiaryEntry, PartKind, Progress } from '../engine/types'
import type { Voice } from '../engine/voice'
import type { StickerId } from '../stickers'

export type ThemeId = 'diary' | 'bricks' | 'creatures' | 'ninja' | 'construction'

/** Every word on the kids' screens that changes with the theme. The diary's are the originals. */
export interface Words {
  /** The app's name, big on the home screen and the welcome cover. */
  appTitle: string
  tagline: string
  /** "Sam's", above the title on the home screen. */
  owner: (name: string) => ReactNode
  /** What the saved thing is called on grown-up screens: "diary", "build log"… */
  thing: string

  // Welcome
  stamp: string
  belongsTo: string
  whose: string
  hintCreate: string
  hintOpen: string
  startButton: string
  openButton: string
  toOpen: string
  toCreate: string

  // Home
  /** After "<b>87</b> of 144", e.g. "facts colored in". */
  factsDone: string
  /** One day of the streak, e.g. "diary day" (also "Diary days in a row" on the report). */
  dayNoun: string
  dayNounPlural: string
  /** After "<b>5</b> of 12", e.g. "stickers". */
  rewardsCount: string
  /** Accessible names for the level bar and the reward shelf. */
  levelBarTitle: string
  shelfLabel: string
  todayTitle: string
  todayDone: string
  startToday: string
  keepGoing: (part: string) => string
  bonusRound: string
  keepGoingBonus: string
  gridButton: string
  bookButton: string

  // Grid page (the doodle page)
  gridTitle: string
  /** The grid page's name inside sentences, e.g. "doodle page". */
  gridName: string
  gridLead: string
  gridTap: string
  notMet: string

  // The book (the diary) and the end of a page
  bookTitle: string
  bookEmpty: string
  greeting: string
  signature: (name: string) => ReactNode
  newReward: (name: string) => ReactNode
  closeBook: string

  // Practice
  fastCheers: readonly string[]
  okCheers: readonly string[]
  breakIdeas: readonly string[]
  copied: string
  oops: string
  trick: string
  newTag: string
  checkupTag: string
  quitTitle: string
  quitText: string
  letsGo: string
  partDone: (title: string) => ReactNode

  /** "she" and "her" in grown-up notes; when absent the player's name is used instead. */
  pronouns?: { she: string; her: string }
}

/** A table's overall progress: not started, met, half colored in, all colored in, all mastered. */
export type TableStage = 0 | 1 | 2 | 3 | 4

/** A moment worth celebrating mid-practice (say, a creature evolving), and its line in the entry. */
export interface Milestone {
  /** Stable id: a milestone is celebrated once, when its key first appears. */
  key: string
  title: string
  /** Shown under the art. */
  text: string
  /** Written in the day's entry. */
  entryLine: string
  art: ReactNode
}

export interface PageProps {
  entry: DiaryEntry
  name: string
  /** 1 for the first entry ever, and so on. */
  number: number
  withSticker?: boolean
}

export interface Theme {
  id: ThemeId
  /** Shown in the theme pickers. */
  name: string
  /** One line under the name in the pickers. */
  blurb: string
  /** The browser bar color. */
  themeColor: string
  words: Words
  /** Names for a fact's levels 0–5 (Blank, Pencil sketch, Inked, Colored in, Sparkly, Gold star). */
  levels: ReadonlyArray<{ name: string; note: string }>
  parts: Record<PartKind, { title: string; blurb: string; intro: string }>
  voice: Voice
  /** Names of the 12 rewards, one per finished page, by the shared reward slot. */
  rewardNames: Record<StickerId, string>
  /** A reward's picture. Rendered as an <svg class="sticker"> 100×100 viewBox by convention. */
  Reward: (props: { id: StickerId; size: number; className?: string }) => ReactNode
  /** The little pictures on the welcome cover. */
  Cover: () => ReactNode
  /** The icon next to the lightning lap's super-fast count. */
  FastIcon: () => ReactNode
  /** The shape behind the cheer after a right answer: an <svg class="burst-shape">. Defaults to the comic burst. */
  BurstShape?: () => ReactNode
  /** The mark on facts at level 4 and 5 in the grid and legend (the diary's sparkle). */
  Mark: (props: { size: number }) => ReactNode
  /** An entry, in the book and at the end of a page. Defaults to the diary page. */
  Page?: (props: PageProps) => ReactNode
  /** Shown on the grid page above the legend, e.g. a creature for each table. */
  Collection?: (props: { progress: Progress }) => ReactNode
  /** Replaces the 12×12 grid on the grid page. Must call onSelect(factId) when a fact is tapped. */
  Grid?: (props: { progress: Progress; selected: string | null; onSelect: (id: string) => void }) => ReactNode
  /** Replaces the reward shelf on the home screen. */
  HomeShelf?: (props: { progress: Progress }) => ReactNode
  /** Every milestone reached so far. New ones are celebrated during practice. */
  milestones?: (p: Progress) => Milestone[]
}
