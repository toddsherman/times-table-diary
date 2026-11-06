import type { PartKind } from '../../engine/types'
import type { Voice } from '../../engine/voice'
import type { Words } from '../types'

export const SITE_NAME = 'Times Table Tower'

export const words: Words = {
  appTitle: SITE_NAME,
  tagline: "Hard hats on. Let's build!",
  owner: (name) => <>{name}'s</>,
  thing: 'site log',

  stamp: 'Hard hat zone!',
  belongsTo: 'Site boss:',
  whose: "Who's the site boss?",
  hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the site log on another device.',
  hintOpen: 'Use the same name and family PIN you started the site log with.',
  startButton: 'Start building',
  openButton: 'Open my site',
  toOpen: 'Already have a site? Open it',
  toCreate: 'Start a new site instead',

  factsDone: 'windows built',
  dayNoun: 'work day',
  dayNounPlural: 'work days',
  rewardsCount: 'machines',
  levelBarTitle: 'Your tower so far',
  shelfLabel: 'Your tower and machines',
  todayTitle: "Today's shift",
  todayDone: "Today's shift is done!",
  startToday: "Start today's shift",
  keepGoing: (part) => `Keep going: ${part}`,
  bonusRound: 'Overtime',
  keepGoingBonus: 'Keep going: overtime',
  newLesson: 'New lesson: another shift',
  lessonNumber: (lesson) => `Shift ${lesson} today`,
  gridButton: 'My tower',
  bookButton: 'Site reports',

  gridTitle: 'My tower',
  gridName: 'tower',
  gridLead: 'Every fact is a window. Practice builds it, then switches its lights on!',
  gridTap: "Tap a window to see how far it's built, and the plan for it.",
  notMet: "This window isn't started yet. It's on the plan!",

  bookTitle: 'Site reports',
  bookEmpty: "No site reports yet. Finish today's shift and your first report shows up here!",
  greeting: 'Daily site report',
  signature: (name) => <>Site boss: {name}</>,
  newReward: (name) => <>New machine: {name}!</>,
  closeBook: 'Clock out',

  fastCheers: ['BOOM!', 'KA-CHUNK!', 'Built it!', 'Rock solid!', 'Full power!', 'Nailed it!', 'Dig it!', 'Top crew!'],
  okCheers: ['Got it!', 'Yes!', 'Solid!', 'On plan!'],
  breakIdeas: [
    'Stretch like a crane. Reach up high!',
    'Shake your arms like a jackhammer!',
    'Sip of water, crew?',
    'Big breath in… and out.',
    'Wiggle your fingers. Ready to dig?',
  ],
  copied: 'Now it’s built!',
  oops: 'Whoops! Almost.',
  trick: "Here's the plan!",
  newTag: 'New job!',
  checkupTag: 'Inspection!',
  quitTitle: 'Break time?',
  quitText: 'Everything is saved. Come back any time today to finish your shift.',
  letsGo: "Let's build!",
  manyMilestones: (count) => `Big day on site: ${count} floors!`,
  partDone: (title) => <>{title} done!</>,
}

export const levels = [
  { name: 'Empty lot', note: 'Not started yet' },
  { name: 'Marked out', note: 'Still learning' },
  { name: 'Framed', note: 'Almost there' },
  { name: 'Built', note: 'Got it!' },
  { name: 'Lights on', note: 'Mastered!' },
  { name: 'Gold star', note: 'Superstar!' },
] as const

export const parts: Record<PartKind, { title: string; blurb: string; intro: string }> = {
  warmup: {
    title: 'Warm-up',
    blurb: 'Facts you know',
    intro: 'Easy ones first, to warm up the engines.',
  },
  new: {
    title: 'New jobs',
    blurb: 'Meet some new facts',
    intro: 'New facts get a NEW JOB! sign. If one is tricky, you get the plan for it.',
  },
  mixed: {
    title: 'Site work',
    blurb: 'A bit of everything',
    intro: 'Old ones, new ones, all mixed up like cement.',
  },
  puzzles: {
    title: 'Puzzles',
    blurb: 'Missing numbers and division',
    intro: 'Find the missing number. 56 ÷ 7 asks: how many 7s make 56?',
  },
  lightning: {
    title: 'Speed run',
    blurb: 'How many super fast?',
    intro: 'Facts you know, full speed ahead! Count your super-fast ones.',
  },
  bonus: {
    title: 'Overtime',
    blurb: 'Extra practice',
    intro: 'Extra practice, just for fun.',
  },
}

/** The site boss writes the day's report: upbeat, a little noisy, all about building. */
export const voice: Voice = {
  openers: [
    'Site report! Big things happened today.',
    "Hard hat on. Here's what we built.",
    'Another day on the job, and what a day!',
    'Crew update: the tower is growing!',
    'Engines on! Here comes the report.',
    'Beep, beep, beep! Backing in with big news.',
  ],
  did: (count, time, fast) => `I did ${count} times table facts in ${time}${fast === null ? '' : `, and ${fast} were SUPER fast`}.`,
  partNames: {
    warmup: 'a warm-up',
    new: 'new jobs',
    mixed: 'site work',
    puzzles: 'puzzles',
    lightning: 'a speed run',
    bonus: 'overtime',
  },
  wholePage: (parts) => `I finished my WHOLE shift: ${parts}!`,
  puzzles: (solved) => `I solved ${solved} puzzles.`,
  puzzleQuips: ['Division is just times tables backwards. Easy as digging a hole!', 'Missing numbers cannot hide from this crew.'],
  lapFirst: (fast) => `My first speed run: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Speed run: ${fast} SUPER fast. NEW SITE RECORD!!!`,
  lapTie: (fast) => `Speed run: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Speed run: ${fast} SUPER fast. My record is ${best}. I'm coming for it!`,
  checkupAll: (count) => `Inspection day! ALL ${count} of my lit-up windows passed. Built to last!`,
  checkupSome: (right, asked) => `Inspection day! ${right} of my ${asked} lit-up windows passed. The others are back on the job list.`,
  perfect: ['EVERY SINGLE ONE right on the first try. Zero mistakes on site!', 'Not one wobble today. This tower is rock solid!'],
  tough: [
    'Some facts were heavy lifting today. But heavy lifting makes you stronger!',
    'Today was a tough shift. But I kept building, and that counts. A lot.',
  ],
  mastered: (facts) => `${facts} got their lights switched on. The tower is glowing!`,
  fixed: (fact) => `${fact} tried to knock my tower over, but I fixed it. Take THAT, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so the crew built those windows right away. Easy job!`,
  metOne: (fact) => `New job on the plan: ${fact}. Let's build it!`,
  metMany: (count) => `${count} new jobs went on the plan today. The tower keeps growing!`,
  streak: (days) => `That's ${days} work days in a row. This crew never stops!`,
  closers: [
    'Time to clock out. More building tomorrow!',
    'Engines off. See you on site tomorrow!',
    'Report done. Hard hat off!',
    'Beep, beep! Backing out for the day.',
    'Time for a snack. Builders need snacks.',
  ],
  again: (lesson) => `That was shift number ${lesson} today! This crew does NOT quit.`,
}
