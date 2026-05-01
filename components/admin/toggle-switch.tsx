'use client'

import { useTransition } from 'react'
import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onToggle: (next: boolean) => Promise<void> | void
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function ToggleSwitch({ checked, onToggle, label, size = 'md', disabled }: ToggleSwitchProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await onToggle(!checked)
    })
  }

  return (
    <label className={cn('flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        disabled={disabled || isPending}
        className={cn(
          'relative rounded-full transition-all duration-200',
          size === 'sm' ? 'w-8 h-4' : 'w-10 h-5',
          checked ? 'bg-gold-DEFAULT' : 'bg-moria-border',
          isPending && 'opacity-70'
        )}
      >
        <span className={cn(
          'absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200',
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
          checked
            ? size === 'sm' ? 'translate-x-4' : 'translate-x-5'
            : 'translate-x-0.5'
        )} />
      </button>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </label>
  )
}
