import type { PartKind } from '../../engine/types'
import type { Voice } from '../../engine/voice'
import type { Words } from '../types'

export const SCHOOL_NAME = 'Times Table Puppy School'

export const words: Words = {
  appTitle: SCHOOL_NAME,
  tagline: 'Train a puppy for every times table!',
  owner: (name) => <>{name}'s</>,
  thing: 'puppy scrapbook',

  stamp: 'Puppies welcome!',
  belongsTo: 'Puppy trainer:',
  whose: 'Who is the puppy trainer?',
  hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the puppy school on another device.',
  hintOpen: 'Use the same name and family PIN you started puppy school with.',
  startButton: 'Start puppy school',
  openButton: 'Open my puppy school',
  toOpen: 'Already a trainer? Open your puppy school',
  toCreate: 'Start a new puppy school instead',

  factsDone: 'good dogs',
  dayNoun: 'puppy day',
  dayNounPlural: 'puppy days',
  rewardsCount: 'toys and treats',
  levelBarTitle: 'Your puppy training so far',
  shelfLabel: 'Your puppies, toys and treats',
  todayTitle: "Today's training",
  todayDone: "Today's training is done!",
  startToday: "Start today's training",
  keepGoing: (part) => `Keep going: ${part}`,
  bonusRound: 'Extra fetch',
  keepGoingBonus: 'Keep going: extra fetch',
  newLesson: 'New lesson: more puppy time',
  lessonNumber: (lesson) => `Lesson ${lesson} today`,
  gridButton: 'My puppies',
  bookButton: 'My scrapbook',

  gridTitle: 'My puppy yard',
  gridName: 'puppy yard',
  gridLead: 'Every times table has its own puppy. Practice its facts to help it grow up!',
  gridTap: 'Tap a square to see how that fact is doing, and a trick for it.',
  notMet: "You haven't sniffed out this one yet. It's coming!",

  bookTitle: 'My puppy scrapbook',
  bookEmpty: "No pages yet. Finish today's training and your first scrapbook page shows up here!",
  greeting: 'Puppy scrapbook',
  signature: (name) => <>Love, {name}</>,
  newReward: (name) => <>A new treat for your puppies: {name}!</>,
  closeBook: 'Close my scrapbook',

  fastCheers: ['Pawsome!', 'Good dog!', 'Woof woof!', 'Top dog!', 'Fetch-tastic!', 'Zoom zoom!', 'Tail wags!', 'Super sniffer!'],
  okCheers: ['Got it!', 'Yes!', 'Good pup!', 'Nice!'],
  breakIdeas: [
    'Stretch like a puppy waking up from a nap!',
    'Shake it out like a wet dog!',
    'Sip of water? Puppies love water.',
    'Big breath in… and a big yawn out.',
    'Wiggle like a happy tail!',
  ],
  copied: 'Good dog! Now you know it!',
  oops: 'Oops! Sniff again.',
  trick: "Trainer's tip:",
  newTag: 'New trick!',
  checkupTag: 'Vet check!',
  quitTitle: 'Nap time?',
  quitText: 'Everything is saved. Come back any time today to finish your training.',
  letsGo: "Let's play!",
  manyMilestones: (count) => `Woof! ${count} puppy moments!`,
  partDone: (title) => <>{title} done!</>,
}

/** A fact's level, from a puppy that hasn't met it yet up to best in show. Good dog (3) is "got it". */
export const levels = [
  { name: 'Not met yet', note: 'Not started yet' },
  { name: 'Sniffing', note: 'Still learning' },
  { name: 'Sitting', note: 'Almost there' },
  { name: 'Good dog', note: 'Got it!' },
  { name: 'Top dog', note: 'Mastered!' },
  { name: 'Best in show', note: 'Superstar!' },
] as const

export const parts: Record<PartKind, { title: string; blurb: string; intro: string }> = {
  warmup: {
    title: 'Morning walk',
    blurb: 'Facts you know',
    intro: 'Easy ones first, like a nice slow walk around the yard.',
  },
  new: {
    title: 'New tricks',
    blurb: 'Learn some new ones',
    intro: 'New facts get a NEW TRICK! tag. If one is tricky, the trainer shows you how.',
  },
  mixed: {
    title: 'Puppy class',
    blurb: 'Practice every trick',
    intro: 'Old tricks and new tricks, all mixed up.',
  },
  puzzles: {
    title: 'Hide and sniff',
    blurb: 'Missing numbers and division',
    intro: 'Sniff out the missing number. 56 ÷ 7 asks: how many 7s make 56?',
  },
  lightning: {
    title: 'Zoomies',
    blurb: 'How many super fast?',
    intro: 'Facts you know, as fast as puppy zoomies! Count your super-fast ones.',
  },
  bonus: {
    title: 'Extra fetch',
    blurb: 'Bonus practice',
    intro: 'Extra practice, just for fun. Fetch!',
  },
}

/** A puppy trainer's scrapbook: excited, loving, and all about the puppies. */
export const voice: Voice = {
  openers: [
    "Woof! Here's what happened at puppy school today.",
    'Leash on, treats ready. Here we go!',
    'Another day with my puppies, and what a day!',
    "Tails were wagging all day. Here's why!",
    'Puppy school report! Sniff, sniff, big news.',
    'I grabbed my treat bag and got to work.',
  ],
  did: (count, time, fast) => `I trained ${count} times table facts in ${time}${fast === null ? '' : `, and ${fast} were SUPER fast`}.`,
  partNames: {
    warmup: 'a morning walk',
    new: 'new tricks',
    mixed: 'puppy class',
    puzzles: 'hide and sniff',
    lightning: 'zoomies',
    bonus: 'extra fetch',
  },
  wholePage: (parts) => `I did my WHOLE training: ${parts}!`,
  puzzles: (solved) => `I sniffed out ${solved} puzzles.`,
  puzzleQuips: ['Division is just times tables playing fetch backwards!', 'No missing number can hide from my super sniffer.'],
  lapFirst: (fast) => `My first zoomies: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Zoomies: ${fast} SUPER fast. NEW PUPPY RECORD!!!`,
  lapTie: (fast) => `Zoomies: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Zoomies: ${fast} SUPER fast. My record is ${best}. Next time, even zoomier!`,
  checkupAll: (count) => `Vet check! ALL ${count} of my Top dog facts were happy and healthy. What good puppies!`,
  checkupSome: (right, asked) => `Vet check! ${right} of my ${asked} Top dog facts passed. The others are going back to puppy class.`,
  perfect: ['Not ONE mistake today. Every tail was wagging!', 'Every single answer right on the first try. Best. Trainer. Ever.'],
  tough: [
    'Some facts were tricky today. But puppies learn one paw at a time!',
    'Today was HARD. But a good trainer never gives up on a puppy, so I kept going!',
  ],
  mastered: (facts) => `${facts} became TOP DOGS today. My puppies are so proud!`,
  fixed: (fact) => `${fact} tried to run off with my sock, but I caught it. Nice try, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so those puppies learned to sit right away. Good dogs!`,
  metOne: (fact) => `I taught a new trick: ${fact}. Woof!`,
  metMany: (count) => `I taught ${count} new tricks today. My puppies are learning so much!`,
  streak: (days) => `That's ${days} puppy days in a row. My puppies can't wait for tomorrow!`,
  closers: [
    'Time for belly rubs. See you tomorrow, puppies!',
    'Leash off. Nap time!',
    'Good dogs, every one of them. Back tomorrow!',
    'Now for a snack. Treats for everyone!',
    'Woof woof! That means bye for now.',
  ],
  again: (lesson) => `That was lesson number ${lesson} today! My puppies wanted MORE.`,
}
