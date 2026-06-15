import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-kessoku-600 text-white hover:bg-kessoku-500 shadow-glow focus-visible:ring-kessoku-500/50',
  secondary:
    'bg-night-700 text-slate-100 hover:bg-night-600 focus-visible:ring-night-500',
  ghost: 'text-slate-300 hover:bg-night-700 focus-visible:ring-night-500',
  outline:
    'border border-night-600 text-slate-200 hover:border-kessoku-500 hover:text-white focus-visible:ring-kessoku-500/40',
  danger: 'bg-red-600/90 text-white hover:bg-red-500 focus-visible:ring-red-500/50',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0 justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
