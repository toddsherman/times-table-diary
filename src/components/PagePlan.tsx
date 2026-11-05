import { PARTS } from '../engine/day'
import type { DayPlan } from '../engine/types'
import { CheckIcon } from './Icons'

/** Today's page as a checklist: done parts ticked off, the next one highlighted. */
export function PagePlan({ plan }: { plan: DayPlan }) {
  return (
    <ol className="page-plan">
      {plan.parts.map((part, i) => {
        const state = part.done ? 'done' : i === plan.current ? 'next' : 'later'
        return (
          <li key={i} className={`plan-step ${state}`} aria-current={state === 'next' ? 'step' : undefined}>
            <span className="plan-mark">{part.done ? <CheckIcon /> : i + 1}</span>
            <span className="plan-title">{PARTS[part.kind].title}</span>
            <span className="plan-blurb">{part.done ? 'Done!' : PARTS[part.kind].blurb}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Small dots for the parts of today's page, for the practice screen's top bar. */
export function PartDots({ plan }: { plan: DayPlan }) {
  return (
    <span className="part-dots" aria-label={`Part ${plan.current + 1} of ${plan.parts.length}`}>
      {plan.parts.map((part, i) => (
        <span key={i} className={`part-dot ${part.done ? 'done' : i === plan.current ? 'now' : ''}`} />
      ))}
    </span>
  )
}
