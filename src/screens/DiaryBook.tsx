import { EntryPage } from '../components/DiaryPage'
import { TopBar } from '../components/TopBar'
import type { Progress } from '../engine/types'
import { useTheme } from '../themes'

export function DiaryBook({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  const { words } = useTheme()
  const entries = progress.entries.map((entry, i) => ({ entry, number: i + 1 })).reverse()
  return (
    <div className="screen diary">
      <TopBar title={words.bookTitle} onBack={onBack} />
      {entries.length === 0 ? (
        <div className="card empty tape">
          <p>{words.bookEmpty}</p>
        </div>
      ) : (
        entries.map(({ entry, number }) => <EntryPage key={entry.at} entry={entry} name={progress.name} number={number} withSticker />)
      )}
    </div>
  )
}
