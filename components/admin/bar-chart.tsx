import { cn, formatCurrency } from '@/lib/utils'

interface BarChartProps {
  data: { label: string; value: number }[]
  formatValue?: (v: number) => string
  height?: number
  accentColor?: string
  className?: string
}

export function BarChart({
  data,
  formatValue = String,
  height = 120,
  accentColor = '#C9A84C',
  className,
}: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, i) => {
          const pct = (item.value / max) * 100
          const isLast = i === data.length - 1

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div
                className="relative w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: isLast
                    ? `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}99 100%)`
                    : 'rgba(201,168,76,0.25)',
                  boxShadow: isLast ? `0 0 12px ${accentColor}40` : 'none',
                }}
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-moria-elevated border border-moria-border text-xs px-2 py-0.5 rounded pointer-events-none z-10">
                  {formatValue(item.value)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-2 mt-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Barra horizontal de progresso para breakdowns
interface HBarProps {
  items: { label: string; value: number; color?: string }[]
  total?: number
  className?: string
}

export function HorizontalBreakdown({ items, total, className }: HBarProps) {
  const sum = total ?? items.reduce((s, i) => s + i.value, 0)

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, i) => {
        const pct = sum > 0 ? (item.value / sum) * 100 : 0
        const colors = [
          '#C9A84C', '#D4AF37', '#A07830', '#8B6914',
          '#6B8B6B', '#4A6B4A',
        ]
        const color = item.color ?? colors[i % colors.length]

        return (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{item.value}</span>
                <span className="text-xs font-bold" style={{ color }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-moria-elevated overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
