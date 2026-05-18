import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, History, LayoutDashboard, LogOut, User } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { Logo } from '@/components/shared/logo'
import { signOut } from '@/actions/auth'

const navLinks = [
  { href: '/barber/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/barber/schedule',  label: 'Agenda',    icon: CalendarDays },
  { href: '/barber/history',   label: 'Histórico', icon: History },
  { href: '/barber/profile',   label: 'Perfil',    icon: User },
]

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!['barber', 'admin'].includes(profile?.role ?? '')) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-moria-black flex flex-col">
      <header className="sticky top-0 z-40 border-b border-moria-border bg-moria-surface/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <Logo size="sm" />
          <nav className="flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="nav-link text-xs px-2.5 py-1.5">
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors rounded-md"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  )
}
