import type { PartKind } from '../../engine/types'
import type { Voice } from '../../engine/voice'
import type { StickerId } from '../../stickers'
import type { Words } from '../types'

/** Everything the creatures theme says, in an upbeat explorer's voice. */
export const WORDS: Words = {
  appTitle: 'Times Table Creatures',
  tagline: 'Every fact you learn helps a creature grow!',
  owner: (name) => `Explorer ${name}'s`,
  thing: 'field journal',

  stamp: 'Explorers only!',
  belongsTo: 'This field journal belongs to:',
  whose: 'Whose field journal is it?',
  hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the journal on another device.',
  hintOpen: 'Use the same name and family PIN you started the journal with.',
  startButton: 'Start exploring',
  openButton: 'Open my journal',
  toOpen: 'Already exploring? Open your journal',
  toCreate: 'Start a new journal instead',

  factsDone: 'facts befriended',
  dayNoun: 'explore day',
  dayNounPlural: 'explore days',
  rewardsCount: 'place stamps',
  levelBarTitle: 'Your facts so far',
  shelfLabel: 'Your creatures',
  todayTitle: "Today's expedition",
  todayDone: "Today's expedition is done!",
  startToday: "Let's explore!",
  keepGoing: (part) => `Keep going: ${part}`,
  bonusRound: 'Bonus trek',
  keepGoingBonus: 'Keep going: bonus trek',
  gridButton: 'My creatures',
  bookButton: 'Field journal',

  gridTitle: 'My creatures',
  gridName: 'creature page',
  gridLead: 'Every times table has an egg. Befriend its facts to hatch it and help it grow!',
  gridTap: 'Tap a square to see how well you know it, plus a trick.',
  notMet: "You haven't spotted this one yet. It's out there somewhere!",

  bookTitle: 'My field journal',
  bookEmpty: "No journal pages yet. Finish today's expedition and it'll show up here!",
  greeting: 'Field notes:',
  signature: (name) => `Explorer: ${name}`,
  newReward: (name) => `New place stamp: ${name}!`,
  closeBook: 'Close my journal',

  fastCheers: ['Wild!', 'Zoom!', 'Amazing!', 'Roar-some!', 'Speedy!', 'Spot on!', 'Woo-hoo!', 'Creature power!'],
  okCheers: ['Got it!', 'Yes!', 'Nice find!', 'Right!'],
  breakIdeas: [
    'Stretch like a sleepy creature!',
    'Flap your arms like wings!',
    'Sip of water, explorer?',
    'Wiggle your toes. Ready?',
    'Big breath in… and out.',
  ],
  copied: 'Now you know it!',
  oops: 'Oops! Almost.',
  trick: "Here's a trick!",
  newTag: 'New find!',
  checkupTag: 'Check-up!',
  quitTitle: 'Rest at camp?',
  quitText: 'Everything is saved. Come back any time today to finish your expedition.',
  letsGo: "Let's go!",
  manyMilestones: (count) => `Whoa! ${count} creatures are growing!`,
  partDone: (title) => `${title} done!`,
}

/** A fact's six levels, from never seen to a legend. Level 3 is "got it". */
export const LEVELS = [
  { name: 'Unexplored', note: 'Not started yet' },
  { name: 'Spotted', note: 'Still learning' },
  { name: 'Tracked', note: 'Almost there' },
  { name: 'Befriended', note: 'Got it!' },
  { name: 'Best friends', note: 'Mastered!' },
  { name: 'Legendary', note: 'Superstar!' },
] as const

export const PARTS: Record<PartKind, { title: string; blurb: string; intro: string }> = {
  warmup: {
    title: 'Warm-up',
    blurb: 'Facts you know',
    intro: 'Easy ones first, to stretch your explorer brain.',
  },
  new: {
    title: 'New finds',
    blurb: 'Spot some new facts',
    intro: 'New facts get a NEW FIND! tag. If one is tricky, you get a trick for it.',
  },
  mixed: {
    title: 'Trek',
    blurb: 'A bit of everything',
    intro: 'Old ones, new ones, all mixed up along the trail.',
  },
  puzzles: {
    title: 'Puzzles',
    blurb: 'Missing numbers and division',
    intro: 'Find the missing number. 56 ÷ 7 asks: how many 7s make 56?',
  },
  lightning: {
    title: 'Speed dash',
    blurb: 'How many super fast?',
    intro: 'Facts you know, as fast as you can. Count your super-fast ones!',
  },
  bonus: {
    title: 'Bonus trek',
    blurb: 'Extra practice',
    intro: 'Extra practice, just for fun.',
  },
}

export const VOICE: Voice = {
  openers: [
    'Field notes, reporting in!',
    'What an expedition today!',
    'Big news from the trail!',
    'Explorer log: today was full of WONDER.',
    'Out exploring again. Guess what I found?',
    'The creatures were busy today, and so was I!',
  ],
  did: (count, time, fast) => `I explored ${count} times table facts in ${time}${fast === null ? '' : `, and ${fast} were SUPER fast`}.`,
  partNames: {
    warmup: 'a warm-up',
    new: 'new finds',
    mixed: 'a trek',
    puzzles: 'puzzles',
    lightning: 'a speed dash',
    bonus: 'a bonus trek',
  },
  wholePage: (parts) => `I finished the WHOLE expedition: ${parts}!`,
  puzzles: (solved) => `I cracked ${solved} puzzles.`,
  puzzleQuips: ['Division is just times tables backwards. Great find!', 'No missing number can hide from an explorer.'],
  lapFirst: (fast) => `My first speed dash: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Speed dash: ${fast} SUPER fast. NEW RECORD!!!`,
  lapTie: (fast) => `Speed dash: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Speed dash: ${fast} SUPER fast. My record is ${best}. I'll beat it next time!`,
  checkupAll: (count) => `Check-up day! I still knew ALL ${count} of my best-friend facts. Nothing gets past me.`,
  checkupSome: (right, asked) => `Check-up day! I still knew ${right} of my ${asked} best-friend facts. The others are back in practice.`,
  perfect: ['EVERY SINGLE ONE right on the first try. A perfect expedition!', 'Zero mistakes. ZERO! My creatures are cheering.'],
  tough: [
    'Some facts were tricky to track down today. But every try makes me a better explorer!',
    'Today was a tough trail. But I kept going, and that counts. A lot.',
  ],
  mastered: (facts) => `${facts} are my best friends now. Mastered!`,
  fixed: (fact) => `${fact} tried to sneak past me, but I tracked it down. Nice try, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so I befriended them all in one go. Easy trail!`,
  metOne: (fact) => `I spotted a new fact: ${fact}. Hello there!`,
  metMany: (count) => `I spotted ${count} new facts. My field guide is filling up!`,
  streak: (days) => `That's ${days} explore days in a row. What a streak!`,
  closers: [
    'Time to rest at camp. More tomorrow!',
    'Explorer, signing off!',
    'Until the next expedition!',
    'My creatures say goodnight!',
    'Snack time. Explorers need snacks.',
  ],
}

/** One place stamp per finished expedition, by reward slot. 'star' is also the picker tile's picture. */
export const STAMP_NAMES: Record<StickerId, string> = {
  heart: 'Coral Bay',
  star: 'Egg Hollow',
  crown: 'Crystal Cave',
  bolt: 'Thunder Cliffs',
  cupcake: 'Berry Grove',
  rainbow: 'Rainbow Falls',
  notes: 'Whistling Dunes',
  icecream: 'Snowcap Summit',
  flower: 'Bloom Meadow',
  cool: 'Volcano Ridge',
  cat: 'Mushroom Forest',
  balloon: 'Cloud Island',
}
