import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { UnauthenticatedError, ForbiddenError } from '@/lib/action-error'

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

export type BarberContext = {
  userId: string
  supabase: SupabaseServer
}

export async function requireBarber(): Promise<BarberContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new UnauthenticatedError()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['barber', 'admin'].includes(profile?.role ?? '')) throw new ForbiddenError()
  return { userId: user.id, supabase }
}
