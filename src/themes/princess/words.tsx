import type { PartKind } from '../../engine/types'
import type { Voice } from '../../engine/voice'
import type { Words } from '../types'

export const KINGDOM = 'Times Table Kingdom'

export const words: Words = {
  appTitle: KINGDOM,
  tagline: 'Find every gem. Fill every crown.',
  owner: (name) => <>Princess {name}'s</>,
  thing: 'royal journal',

  stamp: 'By royal decree',
  belongsTo: 'Your royal name:',
  whose: 'Whose kingdom is it?',
  hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the kingdom on another device.',
  hintOpen: 'Use the same name and family PIN you started your kingdom with.',
  startButton: 'Enter the castle',
  openButton: 'Open my kingdom',
  toOpen: 'Already have a kingdom? Open it',
  toCreate: 'Start a new kingdom instead',

  factsDone: 'gems polished',
  dayNoun: 'royal day',
  dayNounPlural: 'royal days',
  rewardsCount: 'royal treasures',
  levelBarTitle: 'Your gems so far',
  shelfLabel: 'Your royal treasures',
  todayTitle: "Today's quest",
  todayDone: "Today's quest is done!",
  startToday: "Start today's quest",
  keepGoing: (part) => `Keep going: ${part}`,
  bonusRound: 'Royal ball',
  keepGoingBonus: 'Keep going: royal ball',
  newLesson: 'New lesson: another quest',
  lessonNumber: (lesson) => `Quest ${lesson} today`,
  gridButton: 'My crowns',
  bookButton: 'My royal letters',

  gridTitle: 'The crown room',
  gridName: 'crown room',
  gridLead: 'Every fact is a gem. Practice cuts it, polishes it, and makes it sparkle!',
  gridTap: 'Tap a gem to see how it shines, and a trick for it.',
  notMet: "This gem is still hidden in the mountains. You'll find it soon!",

  bookTitle: 'My royal letters',
  bookEmpty: "No royal letters yet. Finish today's quest and your first letter appears here!",
  greeting: 'Dear kingdom,',
  signature: (name) => <>Princess {name}</>,
  newReward: (name) => <>New royal treasure: {name}!</>,
  closeBook: 'Seal my letter',

  fastCheers: ['Huzzah!', 'Dazzling!', 'Royally fast!', 'Brilliant!', 'Magnificent!', 'Splendid!', 'Ta-da!', 'Sparkly!'],
  okCheers: ['Got it!', 'Yes!', 'Correct!', 'Well done!'],
  breakIdeas: [
    'Royal stretch! Reach up as tall as a tower.',
    'Take a bow to your kingdom!',
    'Gallop in place like a unicorn!',
    'Sip of water, Your Highness?',
    'Big breath in… and out.',
  ],
  copied: 'Now it shines!',
  oops: 'Oh my! Almost.',
  trick: "Here's a royal trick!",
  newTag: 'New gem!',
  checkupTag: 'Crown check!',
  quitTitle: 'Rest in the castle?',
  quitText: 'Everything is saved. Come back any time today to finish your quest.',
  letsGo: 'Onward!',
  manyMilestones: (count) => `${count} crowns shine brighter!`,
  partDone: (title) => <>{title} done!</>,
}

/** A fact's level as a gem, from an empty setting to a crown jewel. Polished (level 3) is "got it". */
export const levels = [
  { name: 'Empty setting', note: 'Not started yet' },
  { name: 'Rough stone', note: 'Still learning' },
  { name: 'Cut gem', note: 'Almost there' },
  { name: 'Polished gem', note: 'Got it!' },
  { name: 'Sparkling gem', note: 'Mastered!' },
  { name: 'Crown jewel', note: 'Fit for a queen!' },
] as const

export const parts: Record<PartKind, { title: string; blurb: string; intro: string }> = {
  warmup: {
    title: 'Royal warm-up',
    blurb: 'Facts you know',
    intro: 'Easy ones first, to wake up the castle.',
  },
  new: {
    title: 'New gems',
    blurb: 'Find some new ones',
    intro: 'New facts get a NEW GEM! tag. If one is tricky, you get a royal trick for it.',
  },
  mixed: {
    title: 'Holding court',
    blurb: 'A bit of everything',
    intro: 'Your royal subjects bring you questions, old and new. Answer them all!',
  },
  puzzles: {
    title: "Dragon's riddles",
    blurb: 'Missing numbers and division',
    intro: 'A friendly dragon asks riddles: find the missing number. 56 ÷ 7 asks: how many 7s make 56?',
  },
  lightning: {
    title: 'Unicorn gallop',
    blurb: 'How many super fast?',
    intro: 'Facts you know, as fast as a unicorn! Count your super-fast ones.',
  },
  bonus: {
    title: 'Royal ball',
    blurb: 'Bonus practice',
    intro: 'Extra practice, just for fun. Everybody dance!',
  },
}

/** The princess writes to her kingdom: brave, kind, a little grand, and proud of her work. */
export const voice: Voice = {
  openers: [
    'Royal news! Big things happened in the castle today.',
    'I put on my crown and got to work.',
    'Hear ye, hear ye! Here is what your princess did today.',
    'Another day of ruling the kingdom, and what a day!',
    'The trumpets played. The flags waved. Then I did MATH.',
    'Today I was brave, clever, and VERY busy.',
  ],
  did: (count, time, fast) => `I answered ${count} times table facts in ${time}${fast === null ? '' : `, and ${fast} were SUPER fast`}.`,
  partNames: {
    warmup: 'a royal warm-up',
    new: 'new gems',
    mixed: 'holding court',
    puzzles: "the dragon's riddles",
    lightning: 'a unicorn gallop',
    bonus: 'the royal ball',
  },
  wholePage: (parts) => `I finished my WHOLE quest: ${parts}!`,
  puzzles: (solved) => `I solved ${solved} of the dragon's riddles.`,
  puzzleQuips: ['Division is just times tables walking backwards. The dragon was amazed!', 'No missing number can hide from a princess this clever.'],
  lapFirst: (fast) => `My first unicorn gallop: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Unicorn gallop: ${fast} SUPER fast. A NEW ROYAL RECORD!!!`,
  lapTie: (fast) => `Unicorn gallop: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Unicorn gallop: ${fast} SUPER fast. My record is ${best}. My unicorn and I will keep practicing!`,
  checkupAll: (count) => `Crown check! I still knew ALL ${count} of my sparkling gems. Not one lost its shine.`,
  checkupSome: (right, asked) => `Crown check! I still knew ${right} of my ${asked} sparkling gems. The rest go back for polishing.`,
  perfect: ['Not ONE mistake today. The whole kingdom cheered!', 'Every single answer right on the first try. Even the dragon bowed!'],
  tough: [
    'Some facts were tricky today. But a brave princess never gives up!',
    'Today was HARD. But I kept going, and that is what real royalty does.',
  ],
  mastered: (facts) => `${facts} started to SPARKLE today. My crowns are glowing!`,
  fixed: (fact) => `${fact} tried to trick me, but I figured it out. Nice try, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so those gems were cut right away. Obviously.`,
  metOne: (fact) => `I found a new gem: ${fact}. Welcome to the crown room!`,
  metMany: (count) => `I found ${count} new gems today. The royal treasure keeps growing!`,
  streak: (days) => `That's ${days} royal days in a row. Nothing can stop this princess!`,
  closers: [
    'Now I must rest my royal brain. Until tomorrow, kingdom!',
    'The castle lights are going out. Goodnight, kingdom!',
    'Time for a royal snack. Even princesses need snacks.',
    'Off to feed my dragon. See you tomorrow!',
    'Royally signing off. Until next time!',
  ],
  again: (lesson) => `That was quest number ${lesson} today! A true princess keeps going.`,
}
