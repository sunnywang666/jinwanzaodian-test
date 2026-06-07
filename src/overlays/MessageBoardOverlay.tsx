import { messageBoardNotes } from '../lib/demoData'
import { GameOverlay } from '../components/GameOverlay'

interface MessageBoardOverlayProps {
  onClose: () => void
}

const noteColors = ['#fff5d8', '#f9efe6', '#e8f0df', '#fce8e2']
const noteRotations = [-1.2, 0.8, -0.6, 1.4, -0.3]

export function MessageBoardOverlay({ onClose }: MessageBoardOverlayProps) {
  return (
    <GameOverlay title="留言板" onClose={onClose}>
      <section className="flex h-full flex-col bg-[#4a4340] px-5 pt-[11dvh]">
        <div className="grid gap-4 pt-4">
          {messageBoardNotes.map((note, index) => (
            <article
              key={note}
              className="px-5 py-4 text-sm leading-6 text-ink/85"
              style={{
                background: noteColors[index % noteColors.length],
                transform: `rotate(${noteRotations[index % noteRotations.length]}deg)`,
                boxShadow: '2px 3px 8px rgba(0,0,0,0.18)',
              }}
            >
              {note}
            </article>
          ))}
        </div>
      </section>
    </GameOverlay>
  )
}
