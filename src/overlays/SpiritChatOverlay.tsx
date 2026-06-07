import { useState, useRef, useEffect } from 'react'
import { spiritAssets } from '../lib/assets'
import { initialChatMessages, quickReplies, type ChatMessage } from '../lib/demoData'
import { AssetImage } from '../components/AssetImage'
import { GameOverlay } from '../components/GameOverlay'

interface SpiritChatOverlayProps {
  spiritName: string
  onGoToHut: () => void
  onClose: () => void
}

export function SpiritChatOverlay({ spiritName, onGoToHut, onClose }: SpiritChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <GameOverlay onClose={onClose}>
      <section className="flex h-full flex-col bg-[#f5ead8]">
        <div className="flex items-center justify-center gap-3 pb-2 pt-[9dvh]">
          <AssetImage
            src={spiritAssets.normal.src}
            fallbackSrc={spiritAssets.normal.fallbackSrc}
            alt={spiritName}
            variant="character"
            className="h-12 drop-shadow-[0_4px_12px_rgba(138,97,74,0.15)]"
          />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-ink">{spiritName}</h1>
            <button
              type="button"
              className="mt-0.5 text-xs text-ink/45 transition hover:text-ink/65"
              onClick={onGoToHut}
            >
              去小屋看看 →
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => {
            const fromSpirit = message.speaker === 'spirit'

            return (
              <div key={message.id} className={`flex items-end gap-2 ${fromSpirit ? 'justify-start' : 'justify-end'}`}>
                {fromSpirit ? (
                  <AssetImage
                    src={spiritAssets.normal.src}
                    fallbackSrc={spiritAssets.normal.fallbackSrc}
                    alt={spiritName}
                    variant="character"
                    className="h-9 shrink-0"
                  />
                ) : null}
                <p
                  className={`max-w-[78%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                    fromSpirit ? 'bg-white/70 text-ink/80' : 'bg-butter/70 text-ink'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-2 px-4 pb-5 pt-2">
          {quickReplies.map((reply) => (
            <button
              key={reply.label}
              type="button"
              className="rounded-full bg-paper/60 px-4 py-3 text-left text-sm text-ink transition hover:bg-paper/80"
              onClick={() => {
                const stamp = Date.now()
                setMessages((current) => [
                  ...current,
                  { id: `user-${stamp}`, speaker: 'user', text: reply.label },
                  { id: `spirit-${stamp}`, speaker: 'spirit', text: reply.response },
                ])
              }}
            >
              {reply.label}
            </button>
          ))}
        </div>
      </section>
    </GameOverlay>
  )
}
