import { useEffect } from 'react'

interface GameOverlayProps {
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export function GameOverlay({ title, onClose, children }: GameOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div className="absolute inset-0 z-30 animate-[pageIn_220ms_ease-out] bg-[#f5ead8]">
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-3 pt-3">
        <button
          type="button"
          className="pointer-events-auto rounded-full bg-ink/20 px-4 py-2 text-sm text-paper backdrop-blur-sm transition hover:bg-ink/30"
          onClick={onClose}
        >
          返回铺子
        </button>
        {title ? (
          <span className="rounded-full bg-ink/15 px-3 py-2 text-xs tracking-[0.08em] text-paper backdrop-blur-sm">
            {title}
          </span>
        ) : null}
      </div>
      <div className="relative h-full w-full overflow-hidden">{children}</div>
    </div>
  )
}
