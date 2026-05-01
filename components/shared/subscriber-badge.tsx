import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscriberBadgeProps {
  planName?: string
  size?: 'sm' | 'md'
  className?: string
}

export function SubscriberBadge({ planName, size = 'md', className }: SubscriberBadgeProps) {
  return (
    <span
      className={cn(
        'subscriber-badge',
        size === 'sm' && 'text-[10px] px-2 py-0.5',
        className
      )}
    >
      <Crown className={cn('shrink-0', size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      {planName ?? 'Assinante'}
    </span>
  )
}
