'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, User, Check, MessageCircle } from 'lucide-react'
import { cn, formatCurrency, getWhatsAppUrl } from '@/lib/utils'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { completeAppointment } from '@/actions/appointments'
import type { Appointment } from '@/types'

interface BarberScheduleViewProps {
  appointments: Appointment[]
  currentDate: string
  barberId: string
}

export function BarberScheduleView({ appointments, currentDate, barberId }: BarberScheduleViewProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const navigate = (direction: 'prev' | 'next') => {
    const current = new Date(currentDate + 'T12:00:00')
    const next = direction === 'next' ? addDays(current, 1) : subDays(current, 1)
    router.push(`/barber/schedule?date=${format(next, 'yyyy-MM-dd')}`)
  }

  const handleComplete = (aptId: string) => {
    startTransition(async () => {
      setCompleting(aptId)
      await completeAppointment(aptId)
      setCompleting(null)
      router.refresh()
    })
  }

  const active = appointments.filter(a => a.status !== 'completed')
  const done = appointments.filter(a => a.status === 'completed')

  return (
    <div className="space-y-5">
      {/* Navegação */}
      <div className="flex items-center justify-between bg-moria-surface rounded-lg border border-moria-border p-3">
        <button onClick={() => navigate('prev')} className="p-2 rounded-md hover:bg-moria-elevated transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="font-bold">{active.length} agendamento{active.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-muted-foreground">{done.length} concluídos</p>
        </div>
        <button onClick={() => navigate('next')} className="p-2 rounded-md hover:bg-moria-elevated transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lista */}
      {active.length === 0 && done.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Nenhum agendamento neste dia
        </div>
      )}

      <div className="space-y-3">
        {appointments.map(apt => {
          const client = apt.client as any
          const sub = apt.subscription as any
          const planName = sub?.plan?.name
          const isCompleted = apt.status === 'completed'

          return (
            <div
              key={apt.id}
              className={cn(
                'rounded-xl border p-4 space-y-3 transition-all',
                apt.is_subscriber
                  ? 'border-gold-DEFAULT/40 bg-gradient-to-r from-gold-DEFAULT/5 to-moria-surface'
                  : 'border-moria-border bg-moria-surface',
                isCompleted && 'opacity-50'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Clock className="w-4 h-4 text-gold-DEFAULT" />
                    {format(new Date(apt.scheduled_at), 'HH:mm')}
                  </div>
                  {apt.is_subscriber && planName && (
                    <SubscriberBadge planName={planName} size="sm" />
                  )}
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => handleComplete(apt.id)}
                    disabled={completing === apt.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/40 hover:bg-green-900/60 text-green-400 text-xs font-medium border border-green-800/40 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {completing === apt.id ? '...' : 'Concluir'}
                  </button>
                )}

                {isCompleted && (
                  <span className="text-xs text-green-400 font-medium">✓ Concluído</span>
                )}
              </div>

              {/* Cliente */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{client?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{client?.phone}</p>
                  </div>
                </div>

                {(client?.whatsapp || client?.phone) && (
                  <a
                    href={getWhatsAppUrl(client.whatsapp ?? client.phone, `Olá ${client.full_name?.split(' ')[0]}! Confirmando seu agendamento às ${format(new Date(apt.scheduled_at), 'HH:mm')}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-green-400 text-xs border border-green-800/30 hover:bg-green-950/20 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WA
                  </a>
                )}
              </div>

              {/* Serviços */}
              {apt.services && apt.services.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(apt.services as any[]).map((svc: any) => (
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

              {apt.total_price > 0 && (
                <p className="text-sm font-bold text-right">{formatCurrency(apt.total_price)}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
