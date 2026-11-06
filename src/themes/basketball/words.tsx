import type { PartKind } from '../../engine/types'
import type { Voice } from '../../engine/voice'
import type { Words } from '../types'

export const words: Words = {
  appTitle: 'Times Table Hoops',
  tagline: 'Every fact is a shot!',
  owner: (name) => <>{name}'s</>,
  thing: 'scorebook',

  stamp: 'Game day!',
  belongsTo: 'Player name:',
  whose: "Who's on the court?",
  hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the scorebook on another device.',
  hintOpen: 'Use the same name and family PIN you started the scorebook with.',
  startButton: 'Tip off!',
  openButton: 'Open my scorebook',
  toOpen: 'Already on the team? Open your scorebook',
  toCreate: 'Start a new scorebook instead',

  factsDone: 'shots made',
  dayNoun: 'game day',
  dayNounPlural: 'game days',
  rewardsCount: 'prizes won',
  levelBarTitle: 'Your shots so far',
  shelfLabel: 'Your banners and trophy case',
  todayTitle: "Today's game",
  todayDone: "Today's game is done!",
  startToday: "Start today's game",
  keepGoing: (part) => `Keep going: ${part}`,
  bonusRound: 'Overtime',
  keepGoingBonus: 'Keep going: overtime',
  newLesson: 'New lesson: another game',
  lessonNumber: (lesson) => `Game ${lesson} today`,
  gridButton: 'My shot charts',
  bookButton: 'Game recaps',

  gridTitle: 'My shot charts',
  gridName: 'shot chart',
  gridLead: 'Every fact is a shot. Practice takes it from air ball all the way to slam dunk!',
  gridTap: 'Tap a square to see the shot and a trick for it.',
  notMet: "You haven't taken this shot yet. It's coming!",

  bookTitle: 'Game recaps',
  bookEmpty: "No recaps yet. Finish today's game and your first one shows up here!",
  greeting: 'Game recap',
  signature: (name) => <>— {name}, team captain</>,
  newReward: (name) => <>New in your trophy case: {name}!</>,
  closeBook: 'Back to the locker room',

  fastCheers: ['Swish!', 'Nothing but net!', 'From downtown!', 'Slam dunk!', 'On fire!', 'Buzzer beater!', 'What a shot!', 'Too quick!'],
  okCheers: ['Got it!', 'Score!', 'Two points!', 'Nice shot!'],
  breakIdeas: [
    'Shoot a pretend free throw. Follow through!',
    "Jump like you're grabbing a rebound!",
    'Dribble an invisible ball. Left hand, right hand!',
    'Sip of water, superstar?',
    'Big breath in… and out. Eyes on the hoop.',
  ],
  copied: 'Back in the game!',
  oops: 'Off the rim! Almost.',
  trick: "Coach's trick:",
  newTag: 'New play!',
  checkupTag: 'Coach check!',
  quitTitle: 'Time out?',
  quitText: 'Everything is saved. Come back any time today to finish your game.',
  letsGo: 'Game on!',
  manyMilestones: (count) => `${count} new pennants!`,
  partDone: (title) => <>{title} done!</>,
}

/** A fact's level as a shot, from not taken yet to a slam dunk. A layup (level 3) is "got it". */
export const levels = [
  { name: 'Not shot yet', note: 'Not started yet' },
  { name: 'Air ball', note: 'Still learning' },
  { name: 'Off the rim', note: 'Almost there' },
  { name: 'Layup', note: 'Got it!' },
  { name: 'Swish', note: 'Mastered!' },
  { name: 'Slam dunk', note: 'Hall of fame!' },
] as const

export const parts: Record<PartKind, { title: string; blurb: string; intro: string }> = {
  warmup: {
    title: 'Shootaround',
    blurb: 'Facts you know',
    intro: 'Easy shots first. Get that arm warmed up!',
  },
  new: {
    title: 'New plays',
    blurb: 'Learn some new ones',
    intro: 'New facts get a NEW PLAY! tag. If one is tricky, Coach draws up a trick for it.',
  },
  mixed: {
    title: 'Scrimmage',
    blurb: 'A bit of everything',
    intro: 'Old plays and new plays, all mixed up. Just like a real game!',
  },
  puzzles: {
    title: 'Trick plays',
    blurb: 'Missing numbers and division',
    intro: 'Find the missing number. 56 ÷ 7 asks: how many 7s make 56?',
  },
  lightning: {
    title: 'Fast break',
    blurb: 'How many super fast?',
    intro: 'Facts you know, as fast as you can run the court! Count your super-fast ones.',
  },
  bonus: {
    title: 'Overtime',
    blurb: 'Extra practice',
    intro: 'Extra practice, because the game is too fun to stop.',
  },
}

/** The team captain writes the game recap: excited, a little bit sportscaster, every number kept. */
export const voice: Voice = {
  openers: [
    "WHAT A GAME! Here's the recap.",
    'Live from the court: big news today!',
    "Ball in my hands, clock ticking… here's how it went.",
    "The crowd went WILD today. Here's why.",
    'Another game day, and what a game!',
    "Laces tied. Ball pumped. Let's go!",
  ],
  did: (count, time, fast) => `I took ${count} times table shots in ${time}${fast === null ? '' : `, and ${fast} were SUPER fast`}.`,
  partNames: {
    warmup: 'a shootaround',
    new: 'new plays',
    mixed: 'a scrimmage',
    puzzles: 'trick plays',
    lightning: 'a fast break',
    bonus: 'overtime',
  },
  wholePage: (parts) => `I played the WHOLE game: ${parts}!`,
  puzzles: (solved) => `I solved ${solved} trick plays.`,
  puzzleQuips: ['Division is just times tables running backwards down the court. Sneaky!', 'No missing number can block my shot.'],
  lapFirst: (fast) => `My first fast break: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Fast break: ${fast} SUPER fast. NEW TEAM RECORD!!!`,
  lapTie: (fast) => `Fast break: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Fast break: ${fast} SUPER fast. My record is ${best}. I'm coming for it!`,
  checkupAll: (count) => `Coach checked my old shots! I still made ALL ${count} of my swish facts. Still got it!`,
  checkupSome: (right, asked) => `Coach checked my old shots! I made ${right} of my ${asked} swish facts. The rest go back to practice.`,
  perfect: ['Not ONE miss today. A perfect shooting game!', 'Every single shot went in on the first try. The crowd is going nuts!'],
  tough: [
    'Some shots were tough today. But even the best players miss, and I kept shooting!',
    'Today was a HARD game. But I never gave up on a single play.',
  ],
  mastered: (facts) => `${facts} turned into SWISHES today. Nothing but net!`,
  fixed: (fact) => `${fact} tried to block my shot, but I got it back. Nice try, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so those shots skipped ahead. Too easy!`,
  metOne: (fact) => `New play in my playbook: ${fact}. Let's run it!`,
  metMany: (count) => `${count} new plays went in my playbook today. Watch out, other team!`,
  streak: (days) => `That's ${days} game days in a row. I'm on a winning streak!`,
  closers: [
    'Game over! See you at practice tomorrow.',
    "That's the final buzzer. Good game, everybody!",
    'Sneakers off. Back on the court tomorrow!',
    'And the crowd goes wild! Signing off.',
    'Time for a snack. Even superstars need snacks.',
  ],
  again: (lesson) => `Game number ${lesson} today! I just could NOT leave the court.`,
}
