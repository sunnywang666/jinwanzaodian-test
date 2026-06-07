import { useState } from 'react'
import type { LogEntry } from '../lib/storage'
import { GameOverlay } from '../components/GameOverlay'
import { PageTurnButton } from '../components/PageTurnButton'

interface LogbookOverlayProps {
  entries: LogEntry[]
  onClose: () => void
}

export function LogbookOverlay({ entries, onClose }: LogbookOverlayProps) {
  const [page, setPage] = useState(0)
  const pageCount = Math.ceil(entries.length / 3)
  const pageEntries = entries.slice(page * 3, page * 3 + 3)

  return (
    <GameOverlay title="营业账本" onClose={onClose}>
      <section className="flex h-full flex-col bg-[#f5ead8] px-4 pb-4 pt-[11dvh]">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {pageEntries.map((entry, index) => (
            <article
              key={entry.date}
              className={`px-4 py-3 ${index % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.4deg]'}`}
              style={{
                background: 'repeating-linear-gradient(transparent, transparent 27px, rgba(212,179,147,0.25) 27px, rgba(212,179,147,0.25) 28px)',
                borderBottom: '1px solid rgba(212,179,147,0.3)',
              }}
            >
              <p className="text-lg font-semibold text-ink">{entry.date}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm leading-7 text-ink/70">
                <p>开门：{entry.openTime}</p>
                <p>关灯：{entry.closeTime}</p>
                <p>状态：{entry.shopMood}</p>
                <p>客人：{entry.guestCount} 位</p>
              </div>
            </article>
          ))}

          <p className="px-4 py-3 text-sm italic leading-6 text-ink/55">
            这周你有两天很早关灯，铺子也跟着精神了一点。
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <PageTurnButton direction="prev" disabled={page === 0} onClick={() => setPage((current) => current - 1)} />
          <span className="text-xs text-ink/50">
            {page + 1} / {pageCount}
          </span>
          <PageTurnButton
            direction="next"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((current) => current + 1)}
          />
        </div>
      </section>
    </GameOverlay>
  )
}
