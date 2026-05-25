'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Scissors, Crown, BarChart3, ShoppingBag, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/admin/clients',       icon: Users,           label: 'Clientes'     },
  { href: '/admin/barbers',       icon: Scissors,        label: 'Barbeiros'    },
  { href: '/admin/plans',         icon: Crown,           label: 'Planos'       },
  { href: '/admin/subscriptions', icon: CreditCard,      label: 'Assinaturas'  },
  { href: '/admin/products',      icon: ShoppingBag,     label: 'Produtos'     },
  { href: '/admin/reports',       icon: BarChart3,       label: 'Relatórios'   },
]

export function AdminNav({ mobile, pendingCount = 0 }: { mobile?: boolean; pendingCount?: number }) {
  const pathname = usePathname()

  if (mobile) {
    return (
      <>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive  = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
          const showBadge = href === '/admin/subscriptions' && pendingCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors min-w-0',
                isActive ? 'text-gold-DEFAULT' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {showBadge && (
                <span className="absolute -top-0.5 right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-crimson-DEFAULT text-[8px] font-bold text-white flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
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
        const isActive  = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
        const showBadge = href === '/admin/subscriptions' && pendingCount > 0
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
              isActive
                ? 'text-gold-DEFAULT bg-gold-DEFAULT/10 border-l-2 border-gold-DEFAULT pl-[10px]'
                : 'text-muted-foreground hover:text-foreground hover:bg-moria-elevated'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {showBadge && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-crimson-DEFAULT text-[10px] font-bold text-white flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}
