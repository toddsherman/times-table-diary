import type { ReactNode } from 'react'
import type { StickerId } from '../../stickers'
import { Glass, Shadow, Track, Wheel } from './kit'
import { C, line, thin } from './palette'

export const excavator = (
  <>
    <Shadow />
    <Track x={6} y={74} w={58} h={16} />
    <rect x={27} y={68} width={18} height={7} fill={C.dark} {...thin} />
    <path d="M6 70V57q0-7 7-7h42v20Z" fill={C.yellow} {...line} />
    <path d="M10 58h14M10 64h14" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
    <path d="M33 51V35q0-5 5-5h11l6 7v14Z" fill={C.yellow} {...line} />
    <Glass d="M37 35h11l3.5 4.5V46H37Z" />
    <path d="M52 61 73 23q3-5 8-3l2 1q3 3 1 7L60 63Z" fill={C.yellow} {...line} />
    <path d="M59 52 71 32" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" />
    <path d="M59 52 71 32" stroke={C.steel} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M77 21l6-2 12 31-6 3Z" fill={C.yellowDark} {...line} />
    <path d="M85 51c-4 9 0 17 10 16l3-15Z" fill={C.dark} {...line} />
    <path d="M90 67.5l1 3.5M95 67l2 3.5" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />
    <circle cx={80} cy={22} r={2.4} fill={C.ink} />
  </>
)

export const dumpTruck = (
  <>
    <Shadow />
    <rect x={8} y={64} width={84} height={9} rx={2} fill={C.dark} {...line} />
    <path d="M6 28 61 39 59 63H13Z" fill={C.orange} {...line} />
    <path d="M23 32l-2 31M37 35l-1 28M50 37l-1 26" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
    <path d="M8 29q10-14 24-6 9-6 18 2 8 0 11 14Z" fill={C.dirt} {...line} />
    <path d="M64 64V41q0-5 5-5h12l11 15v13Z" fill={C.yellow} {...line} />
    <Glass d="M69 41h11l7 10H69Z" />
    <rect x={88} y={59} width={7} height={8} rx={1.5} fill={C.dark} {...thin} />
    <Wheel cx={24} cy={80} r={10} />
    <Wheel cx={45} cy={80} r={10} />
    <Wheel cx={79} cy={80} r={10} />
  </>
)

export const towerCrane = (
  <>
    <Shadow cx={36} rx={22} />
    <rect x={20} y={84} width={32} height={8} rx={1.5} fill={C.concrete} {...line} />
    <rect x={30} y={18} width={12} height={66} fill={C.yellow} {...line} />
    <path d="M30 18 42 29 30 40 42 51 30 62 42 73 30 84" fill="none" stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
    <path d="M36 3 8 13M36 3 92 13" stroke={C.ink} strokeWidth={1.6} />
    <path d="M30 13 36 3 42 13" fill="none" {...line} />
    <rect x={4} y={12} width={92} height={8} fill={C.yellow} {...line} />
    <path d="M10 20l5-8 5 8 5-8 5 8M44 20l5-8 5 8 5-8 5 8 5-8 5 8 5-8 5 8 5-8" fill="none" stroke={C.ink} strokeWidth={1.6} strokeLinejoin="round" />
    <rect x={5} y={20} width={14} height={10} rx={1} fill={C.concrete} {...line} />
    <rect x={42} y={20} width={11} height={11} rx={1.5} fill={C.yellow} {...thin} />
    <rect x={44.5} y={22.5} width={6} height={5} fill={C.glass} stroke={C.ink} strokeWidth={1.5} />
    <rect x={74} y={19} width={8} height={5} fill={C.dark} {...thin} />
    <path d="M78 24v30" stroke={C.ink} strokeWidth={1.8} />
    <path d="M78 54v3q0 4-4 4" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
    <path d="M78 57 66 66M78 57 90 66" stroke={C.ink} strokeWidth={1.6} />
    <rect x={62} y={66} width={32} height={7} fill={C.orange} {...line} />
    <path d="M62 69.5h32" stroke={C.ink} strokeWidth={1.5} />
  </>
)

export const bulldozer = (
  <>
    <Shadow cx={48} />
    <Track x={8} y={72} w={60} h={18} />
    <path d="M10 72V57q0-3 3-3h47v18Z" fill={C.yellow} {...line} />
    <rect x={18} y={41} width={5} height={13} rx={1} fill={C.dark} {...thin} />
    <path d="M12 60h18M12 66h18" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
    <path d="M36 54V34h24v20" fill={C.yellow} {...line} />
    <Glass d="M40 38h16v12H40Z" />
    <path d="M60 64 82 60M58 78 82 80" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
    <path d="M60 64 82 60M58 78 82 80" stroke={C.dark} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M80 48q-8 21 0 42h10q-5-21 1-42Z" fill={C.yellow} {...line} />
    <path d="M80 86h10" stroke={C.ink} strokeWidth={3} />
  </>
)

export const cementMixer = (
  <>
    <Shadow />
    <rect x={6} y={64} width={86} height={9} rx={2} fill={C.dark} {...line} />
    <rect x={56} y={48} width={8} height={17} fill={C.dark} {...thin} />
    <rect x={12} y={52} width={7} height={13} fill={C.dark} {...thin} />
    <ellipse cx={36} cy={44} rx={30} ry={17} transform="rotate(-12 36 44)" fill={C.white} {...line} />
    <path d="M17 33q9 10 4 25M33 28q9 12 4 30M50 26q8 12 4 26" fill="none" stroke={C.orange} strokeWidth={5} strokeLinecap="round" />
    <ellipse cx={36} cy={44} rx={30} ry={17} transform="rotate(-12 36 44)" fill="none" {...line} />
    <path d="M9 50 3 60" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
    <path d="M9 50 3 60" stroke={C.steel} strokeWidth={2} strokeLinecap="round" />
    <path d="M68 64V41q0-5 5-5h10l10 15v13Z" fill={C.yellow} {...line} />
    <Glass d="M73 41h9l6.5 10H73Z" />
    <Wheel cx={22} cy={80} r={10} />
    <Wheel cx={42} cy={80} r={10} />
    <Wheel cx={80} cy={80} r={10} />
  </>
)

export const roadRoller = (
  <>
    <Shadow />
    <path d="M10 76V50h42v26Z" fill={C.yellow} {...line} />
    <path d="M14 22h40v5H14Z" fill={C.yellow} {...line} />
    <path d="M19 27v23M49 27v23" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <rect x={26} y={40} width={12} height={10} rx={2} fill={C.dark} {...thin} />
    <path d="M42 38l6 8" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <circle cx={74} cy={72} r={18} fill={C.steel} {...line} />
    <circle cx={74} cy={72} r={7} fill={C.dark} {...thin} />
    <path d="M52 66V58q22-14 42 0v8h-6q-14-14-30 0Z" fill={C.yellow} {...line} />
    <Wheel cx={25} cy={78} r={12} />
  </>
)

export const forklift = (
  <>
    <Shadow />
    <path d="M14 80V52q0-6 6-6h40v34Z" fill={C.orange} {...line} />
    <path d="M8 80V58h12v22Z" fill={C.dark} {...line} />
    <path d="M25 46 29 20h29v26" fill="none" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={32} y={36} width={11} height={10} rx={2} fill={C.dark} {...thin} />
    <rect x={61} y={14} width={7} height={72} rx={1} fill={C.dark} {...line} />
    <path d="M66 84h28" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <rect x={70} y={76} width={24} height={6} fill={C.dirt} {...thin} />
    <rect x={72} y={56} width={20} height={20} fill="#d9a66a" {...line} />
    <path d="M82 56v8M78 64h8" stroke={C.ink} strokeWidth={2} />
    <Wheel cx={52} cy={81} r={9} />
    <Wheel cx={22} cy={83} r={7} />
  </>
)

export const wheelLoader = (
  <>
    <Shadow />
    <path d="M6 70V48q0-4 4-4h34v26Z" fill={C.yellow} {...line} />
    <path d="M10 50v14M15 50v14" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
    <path d="M28 44V26q0-4 4-4h14l6 6v16Z" fill={C.yellow} {...line} />
    <Glass d="M32 26h13l3.5 3.5V40H32Z" />
    <path d="M44 70V56h20v14Z" fill={C.yellow} {...line} />
    <path d="M50 60 79 37l6 6-29 22Z" fill={C.yellowDark} {...line} />
    <path d="M75 26h21l-2 24q-12 3-16-6Z" fill={C.yellow} {...line} />
    <path d="M85 51l1 3.5M91 50l1.5 3.5" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />
    <Wheel cx={22} cy={77} r={13} />
    <Wheel cx={64} cy={77} r={13} />
  </>
)

export const backhoe = (
  <>
    <Shadow />
    <path d="M16 72V50h60v22Z" fill={C.yellow} {...line} />
    <path d="M36 50V27q0-4 4-4h16l4 5v22Z" fill={C.yellow} {...line} />
    <Glass d="M40 27h14l2.5 3V44H40Z" />
    <path d="M60 54 84 58" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M60 54 84 58" stroke={C.yellowDark} strokeWidth={3} strokeLinecap="round" />
    <path d="M78 52h18l-2 19q-10 3-14-6Z" fill={C.dark} {...line} />
    <path d="M20 58 10 24l7-2 10 34Z" fill={C.yellow} {...line} />
    <path d="M11 23 4 48l6 2 7-26Z" fill={C.yellowDark} {...line} />
    <path d="M3 47q-2 9 6 10l3-8Z" fill={C.dark} {...line} />
    <Wheel cx={30} cy={78} r={12} />
    <Wheel cx={68} cy={81} r={9} />
  </>
)

export const grader = (
  <>
    <Shadow />
    <path d="M40 50h50q4 0 4 4v8H40Z" fill={C.yellow} {...line} />
    <path d="M6 72V48h36v24Z" fill={C.yellow} {...line} />
    <path d="M18 48V26q0-4 4-4h16l4 5v21Z" fill={C.yellow} {...line} />
    <Glass d="M22 26h14l2.5 3V42H22Z" />
    <path d="M62 62v8" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <circle cx={62} cy={72} r={5} fill={C.dark} {...thin} />
    <path d="M46 80q14-6 32-2v6q-18-4-32 2Z" fill={C.steel} {...line} />
    <path d="M86 62v8" stroke={C.ink} strokeWidth={4} />
    <Wheel cx={14} cy={80} r={10} />
    <Wheel cx={34} cy={80} r={10} />
    <Wheel cx={86} cy={80} r={10} />
  </>
)

export const cherryPicker = (
  <>
    <Shadow />
    <rect x={6} y={64} width={86} height={9} rx={2} fill={C.dark} {...line} />
    <rect x={8} y={56} width={58} height={8} fill={C.yellow} {...line} />
    <rect x={24} y={48} width={16} height={8} rx={1.5} fill={C.dark} {...thin} />
    <path d="M30 50 50 24" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <path d="M30 50 50 24" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" />
    <path d="M50 24 70 14" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <path d="M50 24 70 14" stroke={C.yellowDark} strokeWidth={3.5} strokeLinecap="round" />
    <circle cx={50} cy={24} r={3} fill={C.dark} {...thin} />
    <path d="M66 10h24v10H66Z" fill={C.orange} {...line} />
    <path d="M66 4h24M68 4v6M78 4v6M88 4v6" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
    <path d="M70 64V41q0-5 5-5h9l9 15v13Z" fill={C.white} {...line} />
    <Glass d="M75 41h8l6 10H75Z" />
    <path d="M70 58h23" stroke={C.orange} strokeWidth={3} />
    <Wheel cx={22} cy={80} r={10} />
    <Wheel cx={42} cy={80} r={10} />
    <Wheel cx={80} cy={80} r={10} />
  </>
)

export const skidSteer = (
  <>
    <Shadow cx={50} rx={38} />
    <path d="M12 78V54q0-4 4-4h20v28Z" fill={C.yellow} {...line} />
    <path d="M14 58h14M14 64h14" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
    <path d="M34 78V34q0-4 4-4h16l8 10v38Z" fill={C.yellow} {...line} />
    <Glass d="M40 36h13l5 6v20H40Z" />
    <path d="M45 36v26M50 36v26" stroke={C.ink} strokeWidth={1.6} />
    <path d="M14 48 28 27h30l12 25" fill="none" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
    <path d="M14 48 28 27h30l12 25" fill="none" stroke={C.dark} strokeWidth={4.2} strokeLinejoin="round" strokeLinecap="round" />
    <path d="M64 49h24l-2 23q-12 4-18-4Z" fill={C.yellow} {...line} />
    <path d="M75 73l1 3.5M81 72l1.5 3.5" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />
    <Wheel cx={24} cy={80} r={11} />
    <Wheel cx={50} cy={80} r={11} />
  </>
)

/** The 12 rewards, one per finished shift, by reward slot. The excavator is the theme's picture. */
export const MACHINES: Record<StickerId, { name: string; art: ReactNode }> = {
  star: { name: 'Excavator', art: excavator },
  heart: { name: 'Dump truck', art: dumpTruck },
  crown: { name: 'Tower crane', art: towerCrane },
  bolt: { name: 'Bulldozer', art: bulldozer },
  cupcake: { name: 'Cement mixer', art: cementMixer },
  rainbow: { name: 'Road roller', art: roadRoller },
  notes: { name: 'Forklift', art: forklift },
  icecream: { name: 'Wheel loader', art: wheelLoader },
  flower: { name: 'Backhoe', art: backhoe },
  cool: { name: 'Grader', art: grader },
  cat: { name: 'Cherry picker', art: cherryPicker },
  balloon: { name: 'Skid steer', art: skidSteer },
}

export const MACHINE_NAMES = Object.fromEntries(Object.entries(MACHINES).map(([id, m]) => [id, m.name])) as Record<StickerId, string>

