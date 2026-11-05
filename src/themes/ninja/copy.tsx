import type { PartKind } from '../../engine/types'
import type { Voice } from '../../engine/voice'
import type { Words } from '../types'

/** A fact's level as a belt, from no belt up to gold. Green (level 3) is "got it". */
export const NINJA_LEVELS: ReadonlyArray<{ name: string; note: string }> = [
  { name: 'No belt', note: 'Not started yet' },
  { name: 'White belt', note: 'Still learning' },
  { name: 'Orange belt', note: 'Almost there' },
  { name: 'Green belt', note: 'Got it!' },
  { name: 'Black belt', note: 'Mastered!' },
  { name: 'Gold belt', note: 'Grand master!' },
]

export const NINJA_PARTS: Record<PartKind, { title: string; blurb: string; intro: string }> = {
  warmup: {
    title: 'Warm-up stretches',
    blurb: 'Facts you know',
    intro: 'Easy ones first. Stretch that brain!',
  },
  new: {
    title: 'New moves',
    blurb: 'Learn some new ones',
    intro: 'New moves get a stamp. If one is tricky, sensei shows you a trick.',
  },
  mixed: {
    title: 'Kata',
    blurb: 'Practice every move',
    intro: 'Kata means practicing your moves again and again. Old ones and new ones, all mixed up.',
  },
  puzzles: {
    title: 'Riddles',
    blurb: 'Missing numbers and division',
    intro: 'Find the missing number. 56 ÷ 7 asks: how many 7s make 56?',
  },
  lightning: {
    title: 'Lightning dash',
    blurb: 'How many super fast?',
    intro: 'Facts you know, as fast as a ninja. Count your super-fast ones!',
  },
  bonus: {
    title: 'Extra training',
    blurb: 'Bonus practice',
    intro: 'Extra practice, for the truly dedicated.',
  },
}

export const NINJA_WORDS: Words = {
  appTitle: 'Times Table Dojo',
  tagline: 'The way of the math ninja',
  owner: (name) => <>{name}'s</>,
  thing: 'training scroll',

  stamp: 'Ninjas in training only',
  belongsTo: 'Your ninja name:',
  whose: 'Whose dojo is it?',
  hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the dojo on another device.',
  hintOpen: 'Use the same name and family PIN you started your training with.',
  startButton: 'Enter the dojo',
  openButton: 'Open my dojo',
  toOpen: 'Already training? Open your dojo',
  toCreate: 'Start a new dojo instead',

  factsDone: 'facts learned',
  dayNoun: 'training day',
  dayNounPlural: 'training days',
  rewardsCount: 'dojo treasures',
  levelBarTitle: 'Your belts so far',
  shelfLabel: 'Your dojo treasures',
  todayTitle: "Today's training",
  todayDone: "Today's training is done!",
  startToday: "Start today's training",
  keepGoing: (part) => `Keep going: ${part}`,
  bonusRound: 'Extra training',
  keepGoingBonus: 'Keep going: extra training',
  gridButton: 'My belts',
  bookButton: 'Read my scrolls',

  gridTitle: 'My dojo board',
  gridName: 'dojo board',
  gridLead: 'Every fact starts with no belt. Train it all the way to black belt!',
  gridTap: 'Tap a square to see its belt and a trick for it.',
  notMet: "You haven't trained this one yet. It's coming!",

  bookTitle: 'My training scrolls',
  bookEmpty: "No scrolls yet. Finish today's training and your first one will appear here!",
  greeting: 'Training notes:',
  signature: (name) => <>— {name}</>,
  newReward: (name) => <>New dojo treasure: {name}!</>,
  closeBook: 'Roll up my scroll',

  fastCheers: ['Hi-yah!', 'Lightning fast!', 'Ninja speed!', 'Swift!', 'Master move!', 'Whoosh!', 'Too quick!', 'Sensei approves!'],
  okCheers: ['Got it!', 'Yes!', 'Correct!', 'Well done!'],
  breakIdeas: [
    'Ninja stretch! Reach for the moon.',
    'Stand like a crane on one foot. Ready?',
    'Shake out your arms like falling leaves.',
    'Sip of water, young ninja?',
    'Big breath in… and out. Focus.',
  ],
  copied: 'Move learned!',
  oops: 'Almost! Focus…',
  trick: "Sensei's trick:",
  newTag: 'New move!',
  checkupTag: 'Sensei test!',
  quitTitle: 'Rest, young ninja?',
  quitText: 'Everything is saved. Come back any time today to finish your training.',
  letsGo: "Let's go!",
  partDone: (title) => <>{title} done!</>,
}

/** A ninja student's training scroll: upbeat, a little sensei wisdom, every number kept. */
export const NINJA_VOICE: Voice = {
  openers: [
    "Training report! Here's what happened in the dojo today.",
    'I bowed, I focused, and then I got to work.',
    'Another day in the dojo. And what a day!',
    'Sensei says a ninja trains every day. So I did!',
    "Deep breath. Focus. Here's today's training.",
    'The dojo was quiet. My brain was NOT.',
  ],
  did: (count, time, fast) => `I trained ${count} times table facts in ${time}${fast === null ? '' : `, and ${fast} were lightning fast`}.`,
  partNames: {
    warmup: 'warm-up stretches',
    new: 'new moves',
    mixed: 'kata',
    puzzles: 'riddles',
    lightning: 'a lightning dash',
    bonus: 'extra training',
  },
  wholePage: (parts) => `I finished ALL my training: ${parts}!`,
  puzzles: (solved) => `I solved ${solved} riddles.`,
  puzzleQuips: ['Division is just times tables walking backwards. Sneaky!', 'No missing number can hide from a ninja.'],
  lapFirst: (fast) => `My first lightning dash: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Lightning dash: ${fast} SUPER fast. NEW DOJO RECORD!!!`,
  lapTie: (fast) => `Lightning dash: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Lightning dash: ${fast} SUPER fast. My record is ${best}. I will train harder!`,
  checkupAll: (count) => `Sensei tested me! I still knew ALL ${count} of my black-belt facts. Nothing escapes this ninja.`,
  checkupSome: (right, asked) => `Sensei tested me! I still knew ${right} of my ${asked} black-belt facts. The rest go back into training.`,
  perfect: ['Not ONE mistake today. My focus was as still as a pond.', 'Every single answer right on the first try. Sensei bowed to ME!'],
  tough: [
    'Some facts were tricky today. But every master was once a beginner.',
    'Today was HARD. But fall down seven times, stand up eight. So I kept going!',
  ],
  mastered: (facts) => `${facts} earned their BLACK BELTS today. My training is paying off!`,
  fixed: (fact) => `${fact} tried to sneak past me, but I caught it. Nice try, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so they jumped straight to orange belt. Obviously.`,
  metOne: (fact) => `I learned a new move: ${fact}. Welcome to the dojo!`,
  metMany: (count) => `I learned ${count} new moves. My brain gets stronger every day.`,
  streak: (days) => `That's ${days} training days in a row. Nothing can break my focus!`,
  closers: [
    'Time to bow out. See you tomorrow, dojo!',
    'Training complete. Ninja, signing off!',
    'Rest well. Tomorrow we train again.',
    'Now for a snack. Even ninjas need snacks.',
    'Bow. Smile. Back tomorrow!',
  ],
}
