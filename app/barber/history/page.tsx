import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Clock, X, AlertCircle } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { getBarberHistory } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import type { AppointmentStatus } from '@/types'

export const metadata = { title: 'Histórico de Atendimentos' }

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled:   'Agendado',
  confirmed:   'Confirmado',
  in_progress: 'Em andamento',
  completed:   'Concluído',
  cancelled:   'Cancelado',
  no_show:     'Faltou',
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled:   'bg-blue-900/30 text-blue-400 border-blue-800/40',
  confirmed:   'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
  in_progress: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
  completed:   'bg-green-900/30 text-green-400 border-green-800/40',
  cancelled:   'bg-red-900/30 text-red-400 border-red-800/40',
  no_show:     'bg-orange-900/30 text-orange-400 border-orange-800/40',
}

const LIMIT = 20

export default async function BarberHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; month?: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['barber', 'admin'].includes(profile?.role ?? '')) redirect('/dashboard')

  const params = await searchParams
  const page   = Math.max(1, Number(params.page ?? 1))
  const status = params.status ?? 'all'
  const month  = params.month  ?? format(new Date(), 'yyyy-MM')

  const { appointments, count } = await getBarberHistory(user.id, page, LIMIT, status, month)
  const totalPages = Math.ceil(count / LIMIT)

  const buildUrl = (overrides: Record<string, string | number>) => {
    const p = { page: String(page), status, month, ...overrides }
    return `/barber/history?${new URLSearchParams(p as Record<string, string>).toString()}`
  }

  const statusOptions: Array<{ value: string; label: string }> = [
    { value: 'all',       label: 'Todos' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'cancelled', label: 'Cancelados' },
    { value: 'no_show',   label: 'Faltaram' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-1">{count} atendimento{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}</p>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map(opt => (
            <Link
              key={opt.value}
              href={buildUrl({ status: opt.value, page: 1 })}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                status === opt.value
                  ? 'bg-gold-DEFAULT text-moria-black border-gold-DEFAULT'
                  : 'border-moria-border text-muted-foreground hover:border-gold-DEFAULT/40'
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <input
          type="month"
          defaultValue={month}
          className="w-full rounded-lg border border-moria-border bg-moria-surface px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
          onChange={undefined}
          name="month"
        />
        {/* month filter é server-side via Link — campo visual apenas; o filtro real via Link acima */}
        <div className="flex gap-2">
          {[
            format(new Date(), 'yyyy-MM'),
            format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'yyyy-MM'),
            format(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1), 'yyyy-MM'),
          ].map(m => (
            <Link
              key={m}
              href={buildUrl({ month: m, page: 1 })}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize',
                month === m
                  ? 'bg-gold-DEFAULT text-moria-black border-gold-DEFAULT'
                  : 'border-moria-border text-muted-foreground hover:border-gold-DEFAULT/40'
              )}
            >
              {format(new Date(m + '-15'), 'MMM/yy', { locale: ptBR })}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      {appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Nenhum atendimento encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt: any) => {
            const client   = apt.client as any
            const services = apt.services as any[]

            return (
              <div
                key={apt.id}
                className={cn(
                  'rounded-xl border border-l-4 p-4 space-y-2.5',
                  apt.is_subscriber
                    ? 'border-gold-DEFAULT/40 border-l-gold-DEFAULT bg-gradient-to-r from-gold-DEFAULT/10 to-moria-surface'
                    : 'border-moria-border border-l-moria-border bg-moria-surface'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{client?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_STYLES[apt.status as AppointmentStatus])}>
                    {STATUS_LABELS[apt.status as AppointmentStatus]}
                  </span>
                </div>

                {services && services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {services.map((svc: any) => (
                      <span
                        key={svc.id}
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full border',
                          svc.covered_by_plan
                            ? 'bg-gold-DEFAULT/10 border-gold-DEFAULT/30 text-gold-DEFAULT'
                            : 'bg-moria-elevated border-moria-border text-muted-foreground'
                        )}
                      >
                        {svc.service?.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {apt.is_subscriber && <SubscriberBadge size="sm" />}
                  {apt.total_price > 0 && (
                    <p className="text-sm font-bold ml-auto">{formatCurrency(apt.total_price)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link
              href={buildUrl({ page: page - 1 })}
              className="px-4 py-2 text-xs rounded-lg border border-moria-border hover:border-gold-DEFAULT/40 transition-colors"
            >
              Anterior
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl({ page: page + 1 })}
              className="px-4 py-2 text-xs rounded-lg border border-moria-border hover:border-gold-DEFAULT/40 transition-colors"
            >
              Próximo
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
