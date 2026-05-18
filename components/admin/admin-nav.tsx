'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Scissors, Crown, BarChart3, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/admin/clients',   icon: Users,           label: 'Clientes'   },
  { href: '/admin/barbers',   icon: Scissors,        label: 'Barbeiros'  },
  { href: '/admin/plans',     icon: Crown,           label: 'Planos'     },
  { href: '/admin/products',  icon: ShoppingBag,     label: 'Produtos'   },
  { href: '/admin/reports',   icon: BarChart3,       label: 'Relatórios' },
]

export function AdminNav({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname()

  if (mobile) {
    return (
      <>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'text-gold-DEFAULT' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </>
    )
  }

  return (
    <>
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
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
