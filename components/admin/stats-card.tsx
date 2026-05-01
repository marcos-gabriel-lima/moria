import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  sub?: string
  trend?: { value: number; label: string }
  accent?: 'gold' | 'green' | 'blue' | 'purple' | 'red'
}

const accentMap = {
  gold:   { icon: 'text-gold-DEFAULT bg-gold-DEFAULT/10',    value: 'text-foreground' },
  green:  { icon: 'text-green-400 bg-green-950/40',          value: 'text-green-400'  },
  blue:   { icon: 'text-blue-400 bg-blue-950/40',            value: 'text-foreground' },
  purple: { icon: 'text-purple-400 bg-purple-950/40',        value: 'text-foreground' },
  red:    { icon: 'text-red-400 bg-red-950/40',              value: 'text-red-400'    },
}

export function StatsCard({ label, value, icon: Icon, sub, trend, accent = 'gold' }: StatsCardProps) {
  const colors = accentMap[accent]

  return (
    <div className="p-5 rounded-xl bg-moria-surface border border-moria-border space-y-4 hover:border-moria-border/80 transition-colors">
      <div className="flex items-start justify-between">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend.value >= 0
              ? 'text-green-400 bg-green-950/40 border border-green-800/30'
              : 'text-red-400 bg-red-950/40 border border-red-800/30'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className={cn('text-2xl font-black', colors.value)}>{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
