'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Crown, Wallet, BarChart3, Scissors, Users, Eye } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { cn } from '@/lib/utils'

const clientNav = [
  { href: '/demo/dashboard',    icon: LayoutDashboard, label: 'Início'       },
  { href: '/demo/appointments', icon: Calendar,         label: 'Agendamentos' },
  { href: '/demo/wallet',       icon: Wallet,           label: 'Carteira'     },
]

const adminNav = [
  { href: '/demo/admin/dashboard', icon: BarChart3, label: 'Admin' },
]

function NavLink({ href, icon: Icon, label, mobile }: { href: string; icon: any; label: string; mobile?: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  if (mobile) {
    return (
      <Link
        href={href}
        className={cn(
          'flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-medium transition-all',
          isActive ? 'text-gold-DEFAULT' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Icon className="w-5 h-5" />
        {label}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
        isActive
          ? 'text-gold-DEFAULT bg-moria-elevated border-l-2 border-gold-DEFAULT'
          : 'text-muted-foreground hover:text-foreground hover:bg-moria-elevated'
      )}
      style={isActive ? { borderLeft: '2px solid #C9A84C' } : {}}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-moria-black flex flex-col">
      {/* Demo banner */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-gold-DEFAULT/10 border-b border-gold-DEFAULT/30 py-2 px-4 text-xs text-gold-DEFAULT font-semibold">
        <Eye className="w-3.5 h-3.5 shrink-0" />
        Modo Demo — dados fictícios para visualização
        <Link href="/" className="ml-3 underline underline-offset-2 text-gold-DEFAULT/70 hover:text-gold-DEFAULT transition-colors">
          Ver landing page →
        </Link>
      </div>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-moria-border bg-moria-surface shrink-0 sticky top-0 h-screen">
          <div className="p-6 border-b border-moria-border">
            <Logo size="sm" />
          </div>

          <nav className="flex-1 p-4 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-3 pb-2">
              Área do Cliente
            </p>
            {clientNav.map(item => (
              <NavLink key={item.href} {...item} />
            ))}

            <div className="pt-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-3 pb-2">
                Painel Admin
              </p>
              {adminNav.map(item => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-moria-border">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gold-DEFAULT">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Carlos Mendes</p>
                <p className="text-xs text-gold-DEFAULT font-medium">✦ Assinante</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-h-[calc(100vh-36px)]">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 border-b border-moria-border bg-moria-surface/90 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 h-14">
              <Logo size="sm" />
              <Link
                href="/demo/admin/dashboard"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-4 h-4" />
                Admin
              </Link>
            </div>
          </header>

          <main className="flex-1">
            <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
              {children}
            </div>
          </main>

          {/* Bottom nav mobile */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-moria-border bg-moria-surface/95 backdrop-blur-md">
            <div className="flex items-center justify-around h-16 px-2">
              {[...clientNav, ...adminNav].map(item => (
                <NavLink key={item.href} {...item} mobile />
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
