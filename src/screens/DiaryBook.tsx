import { DiaryPage } from '../components/DiaryPage'
import { TopBar } from '../components/TopBar'
import type { Progress } from '../engine/types'

export function DiaryBook({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  const entries = [...progress.entries].reverse()
  return (
    <div className="screen diary">
      <TopBar title="My diary" onBack={onBack} />
      {entries.length === 0 ? (
        <div className="card empty tape">
          <p>No diary pages yet. Write today's entry and it'll show up here!</p>
        </div>
      ) : (
        entries.map((entry) => <DiaryPage key={entry.at} entry={entry} name={progress.name} withSticker />)
      )}
    </div>
  )
}
