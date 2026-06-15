import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from './cn'

/**
 * Wrapper label + champ. Field est la source unique de l'id : il génère un id
 * stable (useId) qu'il pose sur le <label> ET injecte dans l'enfant (Input /
 * Select / Textarea) s'il n'en a pas déjà un. Les usages qui passent htmlFor
 * et/ou un id explicite restent valides (htmlFor prioritaire, id de l'enfant
 * préservé).
 */
export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  const generatedId = useId()
  const fieldId = htmlFor ?? generatedId
  const child =
    isValidElement(children) && (children.props as { id?: string }).id === undefined
      ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId })
      : children

  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={fieldId} className="field-label">
        {label}
      </label>
      {child}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('field-input', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn('field-input resize-y', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export interface SelectOption {
  value: string
  label: string
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }
>(({ className, options, ...props }, ref) => (
  <select ref={ref} className={cn('field-input cursor-pointer pr-8', className)} {...props}>
    {options.map((o) => (
      <option key={o.value} value={o.value} className="bg-night-850">
        {o.label}
      </option>
    ))}
  </select>
))
Select.displayName = 'Select'
