import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/lib/supabase/server'
import { BarberProfileForm } from '@/components/barber/barber-profile-form'

export const metadata = { title: 'Meu Perfil' }

export default async function BarberProfilePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: profile }, { data: barber }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('barbers').select('*').eq('id', user.id).single(),
  ])

  if (!['barber', 'admin'].includes(profile?.role ?? '')) redirect('/dashboard')
  if (!barber) redirect('/dashboard')

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-black">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações profissionais</p>
      </div>

      <BarberProfileForm profile={profile as any} barber={barber as any} />
    </div>
  )
}
