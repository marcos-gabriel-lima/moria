import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, User, Crown, Calendar, Scissors, Phone, MessageCircle } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { ClientDetailActions } from '@/components/admin/client-detail-actions'
import { cn, formatCurrency, getAppointmentStatusLabel, getAppointmentStatusColor, formatDate } from '@/lib/utils'

export const metadata = { title: 'Detalhe do Cliente' }

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { id } = await params

  const [{ data: profile }, { data: subscriptions }, { data: appointments }, { data: plans }, { data: payments }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).eq('role', 'client').single(),
    supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('*, barber:barbers(profile:profiles(full_name)), services:appointment_services(service:services(name))')
      .eq('client_id', id)
      .order('scheduled_at', { ascending: false })
      .limit(30),
    supabase.from('plans').select('id, name, price').eq('is_active', true),
    supabase.from('payments').select('amount').eq('client_id', id).eq('status', 'paid'),
  ])

  if (!profile) notFound()

  const activeSub = subscriptions?.find(s => s.status === 'active' && new Date(s.expires_at ?? 0) > new Date())
  const totalSpent = payments?.reduce((s, p) => s + p.amount, 0) ?? 0
  const completedApts = appointments?.filter(a => a.status === 'completed').length ?? 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Voltar */}
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Clientes
      </Link>

      {/* Header do perfil */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 sm:p-6 rounded-xl bg-moria-surface border border-moria-border">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center text-xl font-black text-muted-foreground shrink-0">
            {profile.full_name?.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black">{profile.full_name}</h1>
              {activeSub && <SubscriberBadge planName={(activeSub.plan as any)?.name} />}
              {!profile.is_active && (
                <span className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 px-2 py-0.5 rounded-full">
                  Inativo
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {profile.phone}
                </span>
              )}
              {(profile.whatsapp ?? profile.phone) && (
                <WhatsAppButton phone={profile.whatsapp ?? profile.phone!} variant="link" size="sm" />
              )}
              <span>Desde {formatDate(profile.created_at, 'MMM/yyyy')}</span>
            </div>
          </div>
        </div>

        <ClientDetailActions
          clientId={profile.id}
          isActive={profile.is_active}
          notes={profile.notes ?? ''}
          activeSubscriptionId={activeSub?.id}
          plans={(plans ?? []) as any[]}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total Gasto', value: formatCurrency(totalSpent), icon: Crown, color: 'text-gold-DEFAULT' },
          { label: 'Cortes Realizados', value: completedApts, icon: Scissors, color: 'text-purple-400' },
          { label: 'Agendamentos', value: appointments?.length ?? 0, icon: Calendar, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-3 sm:p-4 rounded-xl bg-moria-surface border border-moria-border">
            <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5 mb-1.5 sm:mb-2', color)} />
            <p className="text-base sm:text-xl font-black leading-tight">{value}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assinaturas */}
        <div className="space-y-3">
          <h2 className="font-bold">Histórico de Assinaturas</h2>
          {subscriptions?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Sem assinaturas</p>
          )}
          <div className="space-y-2">
            {subscriptions?.map(sub => {
              const plan = sub.plan as any
              const isActive = sub.status === 'active' && new Date(sub.expires_at ?? 0) > new Date()
              return (
                <div key={sub.id} className={cn(
                  'p-4 rounded-xl border',
                  isActive ? 'border-gold-DEFAULT/30 bg-gold-DEFAULT/5' : 'border-moria-border bg-moria-surface'
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{plan?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.started_at && `Início: ${format(new Date(sub.started_at), 'dd/MM/yyyy')}`}
                        {sub.expires_at && ` · Exp: ${format(new Date(sub.expires_at), 'dd/MM/yyyy')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold-DEFAULT">{formatCurrency(plan?.price ?? 0)}</p>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                        isActive
                          ? 'text-green-400 bg-green-950/40 border-green-800/40'
                          : sub.status === 'cancelled'
                          ? 'text-red-400 bg-red-950/40 border-red-800/40'
                          : 'text-muted-foreground bg-moria-elevated border-moria-border'
                      )}>
                        {sub.status === 'active' ? 'Ativo' : sub.status === 'cancelled' ? 'Cancelado' : 'Expirado'}
                      </span>
                    </div>
                  </div>
                  {sub.cancel_reason && (
                    <p className="text-xs text-muted-foreground mt-2 border-t border-moria-border pt-2">
                      Motivo: {sub.cancel_reason}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Agendamentos recentes */}
        <div className="space-y-3">
          <h2 className="font-bold">Agendamentos Recentes</h2>
          {appointments?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Sem agendamentos</p>
          )}
          <div className="space-y-2">
            {appointments?.slice(0, 10).map(apt => {
              const barber = apt.barber as any
              const services = apt.services as any[]
              return (
                <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-moria-surface border border-moria-border">
                  <div className="text-xs font-bold text-gold-DEFAULT w-10 shrink-0">
                    {format(new Date(apt.scheduled_at), 'dd/MM')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{services?.map((s: any) => s.service?.name).join(', ')}</p>
                    <p className="text-xs text-muted-foreground">{barber?.profile?.full_name}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', getAppointmentStatusColor(apt.status))}>
                    {getAppointmentStatusLabel(apt.status)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Notas internas */}
      {profile.notes && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30">
          <p className="text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wider">Notas Internas</p>
          <p className="text-sm text-muted-foreground">{profile.notes}</p>
        </div>
      )}
    </div>
  )
}
