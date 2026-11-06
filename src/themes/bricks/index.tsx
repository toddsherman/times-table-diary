import type { Voice } from '../../engine/voice'
import { tableStage } from '../tables'
import type { Milestone, Theme } from '../types'
import { BrickModel, BurstShape, Cover, FastIcon, Mark, Reward } from './art'
import { BUILDS, REWARD_NAMES } from './models'
import './bricks.css'
import { BuildCollection, BuildLogPage } from './views'

const voice: Voice = {
  openers: [
    'Reporting in from the build table!',
    "Okay, builders, here's what I built today.",
    'BIG news from the build table!',
    "Today was a brick-tastic day. Here's why.",
    'Bricks out, brain on! And guess what?',
    'Click, clack, SNAP! Time to write it all down.',
  ],
  did: (count, time, fast) => `I snapped together ${count} times table facts in ${time}${fast === null ? '' : `, and ${fast} clicked in SUPER fast`}.`,
  partNames: {
    warmup: 'a warm-up',
    new: 'new bricks',
    mixed: 'practice',
    puzzles: 'puzzles',
    lightning: 'a speed build',
    bonus: 'bonus bricks',
  },
  wholePage: (parts) => `I finished my WHOLE build: ${parts}!`,
  puzzles: (solved) => `I solved ${solved} puzzles.`,
  puzzleQuips: ['Division is just building backwards. Who knew?!', 'No missing brick can hide from me.'],
  lapFirst: (fast) => `My first speed build: ${fast} SUPER fast!`,
  lapRecord: (fast) => `Speed build: ${fast} SUPER fast. NEW RECORD!!!`,
  lapTie: (fast) => `Speed build: ${fast} SUPER fast. I tied my record!`,
  lapBelow: (fast, best) => `Speed build: ${fast} SUPER fast. My record is ${best}. I'm coming for it!`,
  checkupAll: (count) => `Check-up day! All ${count} of my shiny bricks were still snapped in tight.`,
  checkupSome: (right, asked) => `Check-up day! ${right} of my ${asked} shiny bricks were still snapped in. The others went back in the practice pile.`,
  perfect: ['Every single brick fit on the first try. Not one wobble!', 'Zero mistakes. ZERO! This build goes on the top shelf.'],
  tough: [
    'Some bricks were super tricky today. But every builder finds tricky pieces!',
    'Okay, today was a HARD build. But I kept going, and that counts. A lot.',
  ],
  mastered: (facts) => `${facts} turned into shiny bricks. Look at them shine!`,
  fixed: (fact) => `${fact} didn't fit at first, but I figured it out. SNAP! Take THAT, ${fact}!`,
  placed: (tables) => `I already know my ${tables}, so those bricks went straight onto my baseplate. Easy build.`,
  metOne: (fact) => `I opened a new brick: ${fact}. Welcome to the build!`,
  metMany: (count) => `I opened ${count} new bricks. My builds are getting BIG.`,
  streak: (days) => `That's ${days} build days in a row. I am UNSTOPPABLE.`,
  closers: [
    'Okay, gotta go. More building tomorrow!',
    'That is all for now. Master builder, signing off!',
    'Bricks back in the box. Until tomorrow!',
    "Click, clack, SNAP! (That's my happy noise.)",
    'Time for a snack. Builders need snacks.',
  ],
  again: (lesson) => `Build number ${lesson} today! I just could NOT stop building.`,
}

/** A table's build finished (every fact colored in), and later gone gold (every fact mastered). */
function milestones(p: Parameters<NonNullable<Theme['milestones']>>[0]): Milestone[] {
  const out: Milestone[] = []
  BUILDS.forEach((build, i) => {
    const table = i + 1
    const stage = tableStage(p, table)
    const thing = build.name.toLowerCase()
    if (stage >= 3) {
      out.push({
        key: `bricks-built-${table}`,
        title: `${build.name} built!`,
        text: `Every ×${table} fact snapped in, so your ${table}s ${thing} is finished. Look at it!`,
        entryLine: `I finished building my ${table}s ${thing}. Every brick snapped in!`,
        art: <BrickModel rows={build.rows} shine label={build.name} />,
      })
    }
    if (stage >= 4) {
      out.push({
        key: `bricks-gold-${table}`,
        title: `Gold ${thing}!`,
        text: `Every ×${table} fact is shiny now, so your ${table}s ${thing} turned GOLD.`,
        entryLine: `My ${table}s ${thing} turned GOLD!!!`,
        art: <BrickModel rows={build.rows} gold shine label={`Gold ${thing}`} />,
      })
    }
  })
  return out
}

/** Bricks: every fact is a brick, and every times table becomes a build. */
export const bricks: Theme = {
  id: 'bricks',
  name: 'Bricks',
  blurb: 'Snap facts together, brick by brick',
  themeColor: '#d9262c',
  words: {
    appTitle: 'Times Table Bricks',
    tagline: 'Build it one fact at a time!',
    owner: (name) => `${name}'s`,
    thing: 'build log',

    stamp: 'Builders only!',
    belongsTo: 'Head builder:',
    whose: 'Whose build log is it?',
    hintCreate: 'A grown-up picks this. Write it down: you need the name and PIN to open the build log on another device.',
    hintOpen: 'Use the same name and family PIN you started the build log with.',
    startButton: 'Start building!',
    openButton: 'Open my build log',
    toOpen: 'Already building? Open your build log',
    toCreate: 'Start a new build log instead',

    factsDone: 'facts snapped in',
    dayNoun: 'build day',
    dayNounPlural: 'build days',
    rewardsCount: 'special pieces',
    levelBarTitle: 'Your bricks so far',
    shelfLabel: 'Your special pieces',
    todayTitle: "Today's build",
    todayDone: "Today's build is done!",
    startToday: "Start today's build",
    keepGoing: (part) => `Keep building: ${part}`,
    bonusRound: 'Bonus bricks',
    keepGoingBonus: 'Keep going: bonus bricks',
    newLesson: 'New lesson: another build',
    lessonNumber: (lesson) => `Build ${lesson} today`,
    gridButton: 'My builds',
    bookButton: 'Read my build log',

    gridTitle: 'My builds',
    gridName: 'builds',
    gridLead: 'Every fact is a brick. Snap in all 12 of a times table and its build is finished!',
    gridTap: 'Tap a brick to see how far along it is, and a trick for it.',
    notMet: "This brick is still in the box. It's coming!",

    bookTitle: 'My build log',
    bookEmpty: "No build log pages yet. Finish today's build and it'll show up here!",
    greeting: 'Build log',
    signature: (name) => `Builder: ${name}`,
    newReward: (name) => `New special piece: ${name}!`,
    closeBook: 'Close my build log',

    fastCheers: ['SNAP!', 'Click!', 'Perfect fit!', 'Master builder!', 'Brick-tastic!', 'Built it!', 'Boom!', 'Stud-tastic!'],
    okCheers: ['Click!', 'Snapped in!', 'Got it!', 'It fits!'],
    breakIdeas: [
      'Stretch break! Reach up like a tall tower.',
      'Wiggle your builder fingers. Ready?',
      'Shake out your arms!',
      'Sip of water?',
      'Big breath in… and out.',
    ],
    copied: 'Snapped in for good!',
    oops: 'Wrong brick! Almost.',
    trick: "Here are the instructions!",
    newTag: 'New brick!',
    checkupTag: 'Check-up!',
    quitTitle: 'Take a break?',
    quitText: 'Your bricks stay right where they are. Come back any time today to finish your build.',
    letsGo: "Let's build!",
    manyMilestones: (count) => `${count} big builds!`,
    partDone: (title) => `${title} done!`,
  },
  levels: [
    { name: 'In the box', note: 'Not started yet' },
    { name: 'Loose brick', note: 'Still learning' },
    { name: 'Wobbly brick', note: 'Almost there' },
    { name: 'Snapped in', note: 'Got it!' },
    { name: 'Shiny brick', note: 'Mastered!' },
    { name: 'Gold brick', note: 'Superstar!' },
  ],
  parts: {
    warmup: { title: 'Warm-up', blurb: 'Bricks you know', intro: 'Easy bricks first, to get your hands building.' },
    new: { title: 'New bricks', blurb: 'Open a new bag', intro: 'New facts get a NEW BRICK! tag. If one is tricky, you get the instructions.' },
    mixed: { title: 'Practice', blurb: 'A bit of everything', intro: 'Old bricks, new bricks, all mixed up.' },
    puzzles: { title: 'Puzzles', blurb: 'Missing numbers and division', intro: 'Find the missing brick. 56 ÷ 7 asks: how many 7s make 56?' },
    lightning: { title: 'Speed build', blurb: 'How many super fast?', intro: 'Bricks you know, as fast as you can. Count your super-fast ones!' },
    bonus: { title: 'Bonus bricks', blurb: 'Extra building', intro: 'Extra building, just for fun.' },
  },
  voice,
  rewardNames: REWARD_NAMES,
  Reward,
  Cover,
  FastIcon,
  Mark,
  BurstShape,
  Page: BuildLogPage,
  Collection: BuildCollection,
  milestones,
}
