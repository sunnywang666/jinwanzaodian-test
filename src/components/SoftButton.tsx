import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface SoftButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  active?: boolean
  block?: boolean
}

const variantClassName: Record<Variant, string> = {
  primary: 'bg-butter text-ink hover:bg-[#ecd59f]',
  secondary: 'bg-white/60 text-ink hover:bg-white/80',
  ghost: 'bg-transparent text-ink hover:bg-white/40',
}

export function SoftButton({
  variant = 'secondary',
  active = false,
  block = false,
  className = '',
  children,
  ...props
}: PropsWithChildren<SoftButtonProps>) {
  const activeClassName = active ? 'ring-2 ring-brown/30 shadow-sm' : ''
  const widthClassName = block ? 'w-full justify-center' : ''

  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm transition ${variantClassName[variant]} ${activeClassName} ${widthClassName} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
