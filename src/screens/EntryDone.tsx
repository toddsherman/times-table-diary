import { useEffect, useRef } from 'react'
import { EntryPage } from '../components/DiaryPage'
import type { DiaryEntry } from '../engine/types'
import { sfx } from '../sound'
import type { StickerId } from '../stickers'
import { useTheme } from '../themes'

export function EntryDone({ entry, name, number, onClose }: { entry: DiaryEntry; name: string; number: number; onClose: () => void }) {
  const { words, rewardNames, Reward } = useTheme()
  const played = useRef(false)
  useEffect(() => {
    if (played.current) return
    played.current = true
    sfx.fanfare()
  }, [])

  const { stats } = entry
  const sticker = entry.sticker as StickerId
  return (
    <div className="screen done">
      <EntryPage entry={entry} name={name} number={number} />
      <div className="new-sticker">
        <Reward id={sticker} size={132} className="pop" />
        <p>{words.newReward(rewardNames[sticker])}</p>
      </div>
      <div className="stickies">
        <div className="sticky">
          <b>{stats.right}</b>of {stats.firstTry} right on the first try
        </div>
        <div className="sticky pink">
          <b>{stats.fast}</b>super fast
        </div>
      </div>
      <button type="button" className="btn pink big" onClick={onClose}>
        {words.closeBook}
      </button>
    </div>
  )
}
