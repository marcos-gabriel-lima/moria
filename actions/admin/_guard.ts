import 'server-only'
import { createClient } from '@/lib/supabase/server'

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

export type AdminContext = {
  userId: string
  supabase: SupabaseServer
}

export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Sem permissão')
  return { userId: user.id, supabase }
}
