import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Scissors, Calendar, TrendingUp, Star } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { EditBarberForm } from '@/components/admin/edit-barber-form'
import { cn, formatCurrency, getAppointmentStatusLabel, getAppointmentStatusColor } from '@/lib/utils'

export const metadata = { title: 'Editar Barbeiro' }

export default async function EditBarberPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { id } = await params

  const [{ data: barber }, { data: recentApts }] = await Promise.all([
    supabase
      .from('barbers')
      .select('*, profile:profiles(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('appointments')
      .select('id, scheduled_at, status, total_price, is_subscriber, client:profiles(full_name), services:appointment_services(service:services(name))')
      .eq('barber_id', id)
      .order('scheduled_at', { ascending: false })
      .limit(20),
  ])

  if (!barber) notFound()

  const profile = barber.profile as any

  // Stats do mês atual
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const monthApts  = recentApts?.filter(a => a.scheduled_at >= monthStart && a.scheduled_at <= monthEnd) ?? []
  const completed  = monthApts.filter(a => a.status === 'completed')
  const revenue    = completed.reduce((s, a) => s + (a.total_price ?? 0), 0)
  const commission = revenue * (barber.commission_rate / 100)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/barbers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Barbeiros
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 p-5 rounded-xl bg-moria-surface border border-moria-border">
        <div className="w-14 h-14 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center text-xl font-black text-muted-foreground shrink-0">
          {profile?.full_name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-black">{profile?.full_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full border font-semibold',
              barber.is_active
                ? 'text-green-400 bg-green-950/30 border-green-800/30'
                : 'text-red-400 bg-red-950/30 border-red-800/30'
            )}>
              {barber.is_active ? 'Ativo' : 'Inativo'}
            </span>
            <span className="text-sm text-muted-foreground">Comissão: {barber.commission_rate}%</span>
          </div>
        </div>
      </div>

      {/* Stats do mês */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Cortes no mês', value: completed.length, icon: Scissors, color: 'text-purple-400' },
          { label: 'Receita bruta',  value: formatCurrency(revenue), icon: TrendingUp, color: 'text-gold-DEFAULT' },
          { label: 'Comissão',       value: formatCurrency(commission), icon: Star, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-xl bg-moria-surface border border-moria-border">
            <Icon className={cn('w-5 h-5 mb-2', color)} />
            <p className="text-xl font-black">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário de edição */}
        <div className="space-y-4">
          <h2 className="font-bold">Dados do Barbeiro</h2>
          <EditBarberForm barber={barber as any} />
        </div>

        {/* Agendamentos recentes */}
        <div className="space-y-3">
          <h2 className="font-bold">Agendamentos Recentes</h2>
          {recentApts?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Sem agendamentos</p>
          )}
          <div className="space-y-2">
            {recentApts?.slice(0, 15).map(apt => {
              const client   = apt.client   as any
              const services = apt.services as any[]
              return (
                <div key={apt.id} className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  (apt as any).is_subscriber
                    ? 'border-gold-DEFAULT/20 bg-gold-DEFAULT/5'
                    : 'border-moria-border bg-moria-surface'
                )}>
                  <div className="text-xs font-bold text-gold-DEFAULT w-10 shrink-0">
                    {format(new Date(apt.scheduled_at), 'dd/MM')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {services?.map((s: any) => s.service?.name).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(apt.total_price ?? 0) > 0 && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatCurrency(apt.total_price ?? 0)}
                      </span>
                    )}
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', getAppointmentStatusColor(apt.status))}>
                      {getAppointmentStatusLabel(apt.status)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
