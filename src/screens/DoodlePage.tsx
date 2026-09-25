import { Fragment, useState } from 'react'
import { Sparkle } from '../components/Icons'
import { TopBar } from '../components/TopBar'
import { factId, FACTORS, parseFact, strategyHint } from '../engine/facts'
import { levelCounts, LEVELS, median } from '../engine/progress'
import type { Progress } from '../engine/types'

export function DoodlePage({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const counts = levelCounts(progress)
  const fact = selected ? parseFact(selected) : null
  const stat = selected ? progress.facts[selected] : null

  return (
    <div className="screen doodles">
      <TopBar title="My doodle page" onBack={onBack} />
      <p className="lead">Every fact starts blank. Practice turns it into a sparkly doodle!</p>

      <div className="legend">
        {LEVELS.map((level, i) => (
          <span key={level.name} className="legend-item">
            <span className={`swatch l${i}`}>{i >= 4 && <Sparkle size={12} />}</span>
            {level.name} <b>{counts[i]}</b>
          </span>
        ))}
      </div>

      <div className="doodle-layout">
        <div className="dgrid">
          <span className="dcell head">×</span>
          {FACTORS.map((b) => (
            <span key={`top-${b}`} className="dcell head">
              {b}
            </span>
          ))}
          {FACTORS.map((a) => (
            <Fragment key={a}>
              <span className="dcell head">{a}</span>
              {FACTORS.map((b) => {
                const id = factId(a, b)
                const level = progress.facts[id].level
                return (
                  <button
                    key={id}
                    type="button"
                    className={`dcell l${level} ${selected === id ? 'selected' : ''}`}
                    aria-label={`${a} times ${b}: ${LEVELS[level].name}`}
                    onClick={() => setSelected(id)}
                  >
                    {level > 0 ? a * b : ''}
                    {level >= 4 && (
                      <span className="sparkle">
                        <Sparkle size={12} />
                      </span>
                    )}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>

        <aside className="card fact-detail">
          {fact && stat ? (
            <>
              <p className="detail-fact">
                {fact.a} × {fact.b} = {stat.level > 0 ? fact.answer : '?'}
              </p>
              <p className="detail-level">
                <span className={`swatch l${stat.level}`} />
                {LEVELS[stat.level].name}: {LEVELS[stat.level].note}
              </p>
              {stat.level > 0 ? <p>{strategyHint(fact.a, fact.b)}</p> : <p>You haven't met this one yet. It's coming!</p>}
              {stat.seen > 0 && (
                <p className="note">
                  Got it right {stat.right} of {stat.seen} {stat.seen === 1 ? 'time' : 'times'}
                  {stat.times.length > 0 && ` · usually ${(median(stat.times) / 1000).toFixed(1)} seconds`}
                </p>
              )}
            </>
          ) : (
            <p className="note">Tap a square to see its doodle level and a trick for it.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
