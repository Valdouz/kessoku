import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from './cn'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** largeur max */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Nom accessible quand `title` est absent. */
  'aria-label'?: string
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  'aria-label': ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // onClose dans une ref : l'effet ci-dessous ne dépend QUE de `open`, sinon il
  // se relancerait à chaque frappe (onClose recréé par le parent) et volerait le
  // focus du champ en cours de saisie vers le premier élément focusable.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const node = dialogRef.current
    const getFocusable = () =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : []

    // Focus initial : premier élément focusable, sinon le conteneur lui-même.
    const focusables = getFocusable()
    ;(focusables[0] ?? node)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key === 'Tab') {
        const els = getFocusable()
        if (els.length === 0) {
          e.preventDefault()
          node?.focus()
          return
        }
        const first = els[0]
        const last = els[els.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || active === node)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title !== undefined ? titleId : undefined}
        aria-label={title === undefined ? ariaLabel : undefined}
        className={cn(
          'card animate-fade-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-b-none outline-none sm:rounded-2xl',
          SIZES[size],
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-3 border-b border-night-700 p-4 sm:px-5">
            <h2 id={titleId} className="text-lg font-semibold text-white">
              {title}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </Button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-night-700 p-4 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
