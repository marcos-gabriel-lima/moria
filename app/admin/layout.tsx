import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { Logo } from '@/components/shared/logo'
import { signOut } from '@/actions/auth'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-moria-black flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-moria-border bg-moria-surface shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-moria-border">
          <Logo size="sm" />
          <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-widest text-crimson-DEFAULT px-2 py-0.5 rounded bg-crimson/10 border border-crimson/20">
            Painel Admin
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <AdminNav />
        </nav>

        <div className="p-3 border-t border-moria-border space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-crimson/20 border border-crimson/30 flex items-center justify-center shrink-0 text-xs font-bold text-crimson-light">
              {profile?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">Administrador</p>
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

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-moria-border bg-moria-surface/95 backdrop-blur-md">
          <div className="flex items-center justify-around h-16 px-2">
            <AdminNav mobile />
          </div>
        </nav>
      </div>
    </div>
  )
}
