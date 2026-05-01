import { MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  phone: string
  message?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'icon' | 'link'
  className?: string
}

export function WhatsAppButton({
  phone,
  message,
  label = 'WhatsApp',
  size = 'md',
  variant = 'button',
  className,
}: WhatsAppButtonProps) {
  const url = getWhatsAppUrl(phone, message)

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  }

  const iconSizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }

  if (variant === 'icon') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center justify-center rounded-full p-2',
          'bg-green-900/40 hover:bg-green-900/60 text-green-400 border border-green-800/50',
          'transition-all duration-200',
          className
        )}
        title={`WhatsApp: ${phone}`}
      >
        <MessageCircle className={iconSizes[size]} />
      </a>
    )
  }

  if (variant === 'link') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center text-green-400 hover:text-green-300 transition-colors',
          sizeClasses[size],
          className
        )}
      >
        <MessageCircle className={iconSizes[size]} />
        {label}
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center rounded-lg font-medium',
        'bg-green-800 hover:bg-green-700 text-white border border-green-700',
        'transition-all duration-200 hover:shadow-[0_0_12px_rgba(34,197,94,0.2)]',
        sizeClasses[size],
        className
      )}
    >
      <MessageCircle className={iconSizes[size]} />
      {label}
    </a>
  )
}
