import { useEffect, useState } from 'react'
import { MasteryChart, PracticeCalendar, TableMeters } from '../components/Charts'
import { TopBar } from '../components/TopBar'
import { fetchAnswers } from '../cloud'
import { dayNumber } from '../engine/dates'
import { factId, FACTORS, showFact } from '../engine/facts'
import { LEVELS, MASTERED, trickiestFacts } from '../engine/progress'
import { buildReport } from '../engine/report'
import type { AnswerRecord, Progress } from '../engine/types'
import { longDay } from '../format'
import { loadQueue, type CloudLink } from '../storage'

const percent = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`

export function Report({ progress, link, onBack }: { progress: Progress; link: CloudLink | null; onBack: () => void }) {
  const [answers, setAnswers] = useState<AnswerRecord[]>(loadQueue)
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>(link ? 'loading' : 'ready')

  useEffect(() => {
    if (!link) return
    let current = true
    fetchAnswers(link)
      .then((remote) => {
        if (!current) return
        setAnswers([...remote, ...loadQueue()])
        setStatus('ready')
      })
      .catch(() => current && setStatus('offline'))
    return () => {
      current = false
    }
  }, [link])

  const today = dayNumber()
  const r = buildReport(progress, answers, today)
  const { retention } = r
  const tricky = trickiestFacts(progress)
  const missing = (table: number) =>
    FACTORS.filter((b) => progress.facts[factId(table, b)].level < MASTERED).map((b) => showFact(factId(table, b)))

  return (
    <div className="screen report">
      <TopBar title="Progress report" onBack={onBack} />
      <p className="report-sub">
        {progress.name}'s times tables
        {status === 'loading' && ' · updating…'}
        {status === 'offline' && " · offline, so retention only counts answers from this device"}
        {!link && ' · this diary isn’t saved online, so retention only counts answers from this device'}
      </p>

      <section className="kpis" aria-label="Summary">
        <div className="tile hero-tile">
          <span className="tile-label">Facts mastered</span>
          <span className="tile-value hero">
            {r.mastered}
            <small> of 144</small>
          </span>
          <span className="tile-note">Answered fast on at least two separate days</span>
        </div>
        <div className="tile">
          <span className="tile-label">Colored in</span>
          <span className="tile-value">{r.coloredIn}</span>
          <span className="tile-note">Answered right and fast at least once</span>
        </div>
        <div className="tile">
          <span className="tile-label">Remembered on re-tests</span>
          <span className="tile-value">{retention.asked > 0 ? percent(retention.right, retention.asked) : '–'}</span>
          <span className="tile-note">
            {retention.asked > 0
              ? `${retention.right} of ${retention.asked} mastered facts, a week or more later (last 30 days)`
              : 'Appears once mastered facts come back for review'}
          </span>
        </div>
        <div className="tile">
          <span className="tile-label">Diary days in a row</span>
          <span className="tile-value">{r.streak}</span>
          <span className="tile-note">
            {r.entries} {r.entries === 1 ? 'entry' : 'entries'} in all
          </span>
        </div>
      </section>

      <section className="card report-card">
        <h2>Facts mastered over time</h2>
        {r.masteredByDay.length >= 2 ? (
          <>
            <MasteryChart points={r.masteredByDay} />
            <details className="table-view">
              <summary>Show as a table</summary>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Mastered</th>
                  </tr>
                </thead>
                <tbody>
                  {r.masteredByDay.map((p) => (
                    <tr key={p.day}>
                      <td>{longDay(p.day)}</td>
                      <td>{p.mastered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <p className="note">The chart starts after a couple of diary days.</p>
        )}
      </section>

      <section className="card report-card">
        <h2>Times tables at a glance</h2>
        <TableMeters tables={r.tables} missing={missing} />
      </section>

      <section className="card report-card">
        <h2>Check-ups</h2>
        <p className="note">
          Every two weeks, a diary entry starts with up to 10 facts she mastered but hasn't practiced for a week or more.
        </p>
        {r.checkups.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Remembered</th>
                <th>Fast</th>
              </tr>
            </thead>
            <tbody>
              {[...r.checkups].reverse().map((c) => (
                <tr key={c.at}>
                  <td>{longDay(c.day)}</td>
                  <td>
                    {c.right} of {c.asked} ({percent(c.right, c.asked)})
                  </td>
                  <td>{c.fast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No check-ups yet. The first one comes once a few facts have been mastered for a week.</p>
        )}
      </section>

      <section className="card report-card">
        <h2>Practice calendar</h2>
        <PracticeCalendar days={r.calendar} />
      </section>

      <section className="card report-card">
        <h2>Trickiest facts right now</h2>
        {tricky.length > 0 ? (
          <ul className="tricky">
            {tricky.map((id) => {
              const f = progress.facts[id]
              return (
                <li key={id}>
                  {showFact(id)}: right {f.right} of {f.seen} · {LEVELS[f.level].name.toLowerCase()}
                </li>
              )
            })}
          </ul>
        ) : (
          <p>Nothing tricky yet.</p>
        )}
      </section>
    </div>
  )
}
