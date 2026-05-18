import { redirect } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { Logo } from '@/components/shared/logo'
import { ClientNav } from '@/components/shared/client-nav'
import { signOut } from '@/actions/auth'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin/dashboard')
  if (profile?.role === 'barber') redirect('/barber/schedule')

  return (
    <div className="min-h-screen bg-moria-black flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-moria-border bg-moria-surface shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-moria-border">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 p-4 space-y-0.5">
          <ClientNav />
        </nav>

        <div className="p-4 border-t border-moria-border space-y-1">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {profile?.full_name?.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-red-400 hover:bg-red-950/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 border-b border-moria-border bg-moria-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 h-14">
            <Logo size="sm" />
            <form action={signOut}>
              <button type="submit" className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
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
            <ClientNav mobile />
          </div>
        </nav>
      </div>
    </div>
  )
}
