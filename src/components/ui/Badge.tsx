import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Classes de couleur (ex. depuis labels.ts -> def.badge). */
  tone?: string
}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tone ?? 'bg-night-600 text-slate-300',
        className,
      )}
      {...props}
    />
  )
}
