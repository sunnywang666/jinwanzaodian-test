interface PageTurnButtonProps {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled?: boolean
  label?: string
}

export function PageTurnButton({ direction, onClick, disabled = false, label }: PageTurnButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-[18px] bg-paper/60 px-4 py-2 text-sm text-ink transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
      onClick={onClick}
    >
      {label ?? (direction === 'prev' ? '上一页' : '下一页')}
    </button>
  )
}
