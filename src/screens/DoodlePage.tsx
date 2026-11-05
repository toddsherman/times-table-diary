import { Fragment, useState } from 'react'
import { TopBar } from '../components/TopBar'
import { factId, FACTORS, parseFact, strategyHint } from '../engine/facts'
import { levelCounts, median } from '../engine/progress'
import type { Progress } from '../engine/types'
import { useTheme } from '../themes'

/** The doodle page, or each theme's version of it: every fact and how far along it is. */
export function DoodlePage({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  const { words, levels: LEVELS, Mark, Collection, Grid } = useTheme()
  const [selected, setSelected] = useState<string | null>(null)
  const counts = levelCounts(progress)
  const fact = selected ? parseFact(selected) : null
  const stat = selected ? progress.facts[selected] : null

  return (
    <div className="screen doodles">
      <TopBar title={words.gridTitle} onBack={onBack} />
      <p className="lead">{words.gridLead}</p>
      {Collection && <Collection progress={progress} />}

      <div className="legend">
        {LEVELS.map((level, i) => (
          <span key={level.name} className="legend-item">
            <span className={`swatch l${i}`}>{i >= 4 && <Mark size={12} />}</span>
            {level.name} <b>{counts[i]}</b>
          </span>
        ))}
      </div>

      <div className="doodle-layout">
        {Grid ? (
          <Grid progress={progress} selected={selected} onSelect={setSelected} />
        ) : (
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
                          <Mark size={12} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        )}

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
              {stat.level > 0 ? <p>{strategyHint(fact.a, fact.b)}</p> : <p>{words.notMet}</p>}
              {stat.seen > 0 && (
                <p className="note">
                  Got it right {stat.right} of {stat.seen} {stat.seen === 1 ? 'time' : 'times'}
                  {stat.times.length > 0 && ` · usually ${(median(stat.times) / 1000).toFixed(1)} seconds`}
                </p>
              )}
            </>
          ) : (
            <p className="note">{words.gridTap}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
