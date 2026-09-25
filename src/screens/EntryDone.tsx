import { useEffect, useRef } from 'react'
import { DiaryPage } from '../components/DiaryPage'
import { Sticker } from '../components/Sticker'
import type { DiaryEntry } from '../engine/types'
import { sfx } from '../sound'
import { STICKER_NAMES, type StickerId } from '../stickers'

export function EntryDone({ entry, name, onClose }: { entry: DiaryEntry; name: string; onClose: () => void }) {
  const played = useRef(false)
  useEffect(() => {
    if (played.current) return
    played.current = true
    sfx.fanfare()
  }, [])

  const { stats } = entry
  return (
    <div className="screen done">
      <DiaryPage entry={entry} name={name} />
      <div className="new-sticker">
        <Sticker id={entry.sticker} size={132} className="pop" />
        <p>New sticker: {STICKER_NAMES[entry.sticker as StickerId]}!</p>
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
        Close my diary
      </button>
    </div>
  )
}
