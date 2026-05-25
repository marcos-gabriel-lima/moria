'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Crown, Wallet, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Início'       },
  { href: '/appointments', icon: Calendar,         label: 'Agendamentos' },
  { href: '/plans',        icon: Crown,            label: 'Planos'       },
  { href: '/wallet',       icon: Wallet,           label: 'Carteira'     },
  { href: '/products',     icon: ShoppingBag,      label: 'Produtos'     },
]

export function ClientNav({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname()

  if (mobile) {
    return (
      <>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors min-w-0',
                isActive ? 'text-gold-DEFAULT' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium truncate w-full text-center px-0.5">{label}</span>
            </Link>
          )
        })}
      </>
    )
  }

  return (
    <>
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
              isActive
                ? 'text-gold-DEFAULT bg-gold-DEFAULT/10 border-l-2 border-gold-DEFAULT pl-[10px]'
                : 'text-muted-foreground hover:text-foreground hover:bg-moria-elevated'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </>
  )
}
