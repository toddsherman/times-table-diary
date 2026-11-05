import { Sparkle } from '../components/Icons'
import { Sticker } from '../components/Sticker'
import { PARTS } from '../engine/day'
import { LEVELS } from '../engine/progress'
import { DIARY_VOICE } from '../engine/voice'
import { STICKER_NAMES } from '../stickers'
import type { Theme } from './types'

/** The original look: a doodled-in, dramatic diary. Every word here is unchanged from before themes. */
export const diary: Theme = {
  id: 'diary',
  name: 'Diary',
  blurb: 'Doodles, stickers and Dear Diary',
  themeColor: '#ff4fa3',
  words: {
    appTitle: 'Times Table Diary',
    tagline: 'Tales from a Not-So-Secret Math Genius',
    owner: (name) => <>{name}'s</>,
    thing: 'diary',

    stamp: 'Top secret! Keep out!',
    belongsTo: 'This diary belongs to:',
    whose: 'Whose diary is it?',
    hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the diary on another device.',
    hintOpen: 'Use the same name and family PIN you started the diary with.',
    startButton: 'Start my diary',
    openButton: 'Open my diary',
    toOpen: 'Already have a diary? Open it',
    toCreate: 'Start a new diary instead',

    factsDone: 'facts colored in',
    dayNoun: 'diary day',
    dayNounPlural: 'diary days',
    rewardsCount: 'stickers',
    levelBarTitle: 'Your doodle page so far',
    shelfLabel: 'Your stickers',
    todayTitle: "Today's page",
    todayDone: "Today's page is done!",
    startToday: "Start today's page",
    keepGoing: (part) => `Keep going: ${part}`,
    bonusRound: 'Bonus round',
    keepGoingBonus: 'Keep going: bonus round',
    gridButton: 'My doodle page',
    bookButton: 'Read my diary',

    gridTitle: 'My doodle page',
    gridName: 'doodle page',
    gridLead: 'Every fact starts blank. Practice turns it into a sparkly doodle!',
    gridTap: 'Tap a square to see its doodle level and a trick for it.',
    notMet: "You haven't met this one yet. It's coming!",

    bookTitle: 'My diary',
    bookEmpty: "No diary pages yet. Finish today's page and it'll show up here!",
    greeting: 'Dear Diary,',
    signature: (name) => <>— {name}</>,
    newReward: (name) => <>New sticker: {name}!</>,
    closeBook: 'Close my diary',

    fastCheers: ['SQUEEE!', 'OMG, YES!', 'Genius!', 'Nailed it!', 'So fab!', 'Boom!', 'Math star!', 'Too easy!'],
    okCheers: ['Got it!', 'Yes!', 'Correct!', 'You got it!'],
    breakIdeas: ['Stretch break! Reach for the sky.', 'Wiggle your fingers. Ready?', 'Shake out your arms!', 'Sip of water?', 'Big breath in… and out.'],
    copied: 'Now you know it!',
    oops: 'Oops! Almost.',
    trick: "Here's a trick!",
    newTag: 'New!',
    checkupTag: 'Check-up!',
    quitTitle: 'Take a break?',
    quitText: 'Everything is saved. Come back any time today to finish your page.',
    letsGo: "Let's go!",
    partDone: (title) => <>{title} done!</>,

    pronouns: { she: 'she', her: 'her' },
  },
  levels: LEVELS,
  parts: PARTS,
  voice: DIARY_VOICE,
  rewardNames: STICKER_NAMES,
  Reward: ({ id, size, className }) => <Sticker id={id} size={size} className={className} />,
  Cover: () => (
    <>
      <Sticker id="star" size={56} />
      <Sticker id="heart" size={48} />
      <Sticker id="bolt" size={52} />
    </>
  ),
  FastIcon: () => <Sticker id="bolt" size={30} />,
  Mark: ({ size }) => <Sparkle size={size} />,
}
