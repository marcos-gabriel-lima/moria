import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, LayoutDashboard, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/shared/logo'
import { signOut } from '@/actions/auth'

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!['barber', 'admin'].includes(profile?.role ?? '')) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-moria-black flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-moria-border bg-moria-surface/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <Logo size="sm" />
          <div className="flex items-center gap-1">
            <Link href="/barber/schedule" className="nav-link text-xs px-2.5 py-1.5">
              <CalendarDays className="w-4 h-4" />
              Agenda
            </Link>
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors rounded-md">
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  )
}
