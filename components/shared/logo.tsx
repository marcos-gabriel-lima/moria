import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: { text: 'text-xl', sub: 'text-[10px]', spacing: 'tracking-[0.3em]' },
    md: { text: 'text-3xl', sub: 'text-xs', spacing: 'tracking-[0.4em]' },
    lg: { text: 'text-5xl', sub: 'text-sm', spacing: 'tracking-[0.5em]' },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex flex-col items-center select-none', className)}>
      <span
        className={cn(
          s.text,
          'font-black uppercase',
          s.spacing,
          'bg-gold-gradient bg-clip-text text-transparent'
        )}
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.4em' }}
      >
        MORIA
      </span>
      <span
        className={cn(
          s.sub,
          s.spacing,
          'text-muted-foreground uppercase font-medium mt-0.5'
        )}
      >
        Barbearia
      </span>
    </div>
  )
}
