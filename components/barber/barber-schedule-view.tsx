'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, User, Check, MessageCircle, Ban, Trash2 } from 'lucide-react'
import { cn, formatCurrency, getWhatsAppUrl } from '@/lib/utils'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { completeAppointment } from '@/actions/appointments'
import { deleteBlockedSlot } from '@/actions/barber'
import { BlockSlotButton } from './block-slot-button'
import type { Appointment, BlockedSlot } from '@/types'

interface BarberScheduleViewProps {
  appointments:  Appointment[]
  blockedSlots:  BlockedSlot[]
  currentDate:   string
  barberId:      string
}

type TimelineItem =
  | { kind: 'appointment'; data: Appointment; time: string }
  | { kind: 'blocked';     data: BlockedSlot;  time: string }

export function BarberScheduleView({ appointments, blockedSlots, currentDate, barberId }: BarberScheduleViewProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
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

  const handleDeleteBlock = (slotId: string) => {
    startTransition(async () => {
      setDeleting(slotId)
      await deleteBlockedSlot(slotId)
      setDeleting(null)
      router.refresh()
    })
  }

  // Merge appointments + blocked slots sorted by time
  const timeline: TimelineItem[] = [
    ...appointments.map(a => ({ kind: 'appointment' as const, data: a, time: a.scheduled_at })),
    ...blockedSlots.map(b => ({ kind: 'blocked' as const,     data: b, time: b.starts_at     })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  const active = appointments.filter(a => a.status !== 'completed')
  const done   = appointments.filter(a => a.status === 'completed')

  return (
    <div className="space-y-5">
      {/* Navegação */}
      <div className="flex items-center justify-between bg-moria-surface rounded-lg border border-moria-border p-3">
        <button onClick={() => navigate('prev')} className="p-2 rounded-md hover:bg-moria-elevated transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="font-bold">{active.length} agendamento{active.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-muted-foreground">
            {done.length} concluídos
            {blockedSlots.length > 0 && ` · ${blockedSlots.length} bloqueio${blockedSlots.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => navigate('next')} className="p-2 rounded-md hover:bg-moria-elevated transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Botão bloquear horário */}
      <div className="flex justify-end">
        <BlockSlotButton currentDate={currentDate} onSuccess={() => router.refresh()} />
      </div>

      {timeline.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Nenhum agendamento ou bloqueio neste dia
        </div>
      )}

      <div className="space-y-3">
        {timeline.map(item => {
          if (item.kind === 'blocked') {
            const slot = item.data as BlockedSlot
            return (
              <div
                key={`block-${slot.id}`}
                className="rounded-xl border border-red-800/30 bg-red-950/20 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Ban className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-300">
                      {format(new Date(slot.starts_at), 'HH:mm')} – {format(new Date(slot.ends_at), 'HH:mm')}
                    </p>
                    {slot.reason && (
                      <p className="text-xs text-muted-foreground">{slot.reason}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlock(slot.id)}
                  disabled={deleting === slot.id}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          }

          const apt        = item.data as Appointment
          const client     = apt.client as any
          const sub        = apt.subscription as any
          const planName   = sub?.plan?.name
          const isCompleted = apt.status === 'completed'

          return (
            <div
              key={`apt-${apt.id}`}
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
