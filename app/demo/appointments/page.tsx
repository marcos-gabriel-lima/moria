import Link from 'next/link'
import { Calendar, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react'
import { DEMO_APPOINTMENTS } from '@/lib/demo-data'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Demo — Agendamentos' }

const statusConfig = {
  confirmed:  { label: 'Confirmado',  color: 'text-green-400 bg-green-950/40 border-green-800/30',   icon: CheckCircle2 },
  scheduled:  { label: 'Agendado',    color: 'text-blue-400 bg-blue-950/40 border-blue-800/30',      icon: Clock        },
  completed:  { label: 'Concluído',   color: 'text-muted-foreground bg-moria-elevated border-moria-border', icon: CheckCircle2 },
  cancelled:  { label: 'Cancelado',   color: 'text-red-400 bg-red-950/40 border-red-800/30',         icon: XCircle      },
  no_show:    { label: 'Não compareceu', color: 'text-red-400 bg-red-950/40 border-red-800/30',      icon: XCircle      },
} as const

export default function DemoAppointmentsPage() {
  const upcoming = DEMO_APPOINTMENTS.filter(a => ['scheduled', 'confirmed'].includes(a.status))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const past = DEMO_APPOINTMENTS.filter(a => a.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  return (
    <div className="space-y-8 max-w-2xl mx-auto lg:mx-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Agendamentos</h1>
        <Link
          href="/demo/dashboard"
          className="flex items-center gap-2 text-sm bg-gold-gradient text-black font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Calendar className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {/* Próximos */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Próximos</h2>
          <div className="space-y-3">
            {upcoming.map(apt => {
              const cfg = statusConfig[apt.status as keyof typeof statusConfig]
              const StatusIcon = cfg.icon
              const barberName = (apt.barber as any)?.profile?.full_name ?? ''
              const serviceName = apt.services[0]?.service?.name ?? ''
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-moria-surface border border-gold-DEFAULT/30 hover:border-gold-DEFAULT/50 transition-colors"
                >
                  {/* Data */}
                  <div className="text-center shrink-0 w-12">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {format(new Date(apt.scheduled_at), 'MMM', { locale: ptBR })}
                    </p>
                    <p className="text-xl font-black leading-none">
                      {format(new Date(apt.scheduled_at), 'dd')}
                    </p>
                    <p className="text-xs text-gold-DEFAULT font-bold mt-0.5">
                      {format(new Date(apt.scheduled_at), 'HH:mm')}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{serviceName}</p>
                    <p className="text-xs text-muted-foreground">{barberName}</p>
                    {apt.is_subscriber && (
                      <span className="inline-block mt-1 text-[10px] text-gold-DEFAULT bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-1.5 py-0.5 rounded-full font-semibold">
                        ✦ Coberto pelo plano
                      </span>
                    )}
                  </div>

                  <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Histórico */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Histórico</h2>
          <div className="space-y-2">
            {past.map(apt => {
              const barberName = (apt.barber as any)?.profile?.full_name ?? ''
              const serviceName = apt.services[0]?.service?.name ?? ''
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-moria-surface border border-moria-border opacity-70"
                >
                  <div className="text-center shrink-0 w-12">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {format(new Date(apt.scheduled_at), 'MMM', { locale: ptBR })}
                    </p>
                    <p className="text-lg font-black leading-none text-muted-foreground">
                      {format(new Date(apt.scheduled_at), 'dd')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{serviceName}</p>
                    <p className="text-xs text-muted-foreground/60">{barberName}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-moria-elevated border border-moria-border px-2 py-0.5 rounded-full">
                    Concluído
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
