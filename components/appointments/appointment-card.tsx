'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, User, Scissors, Crown, MessageCircle, X } from 'lucide-react'
import { cn, formatCurrency, getAppointmentStatusLabel, getAppointmentStatusColor, getWhatsAppUrl } from '@/lib/utils'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { cancelAppointment } from '@/actions/appointments'
import type { Appointment } from '@/types'

interface AppointmentCardProps {
  appointment: Appointment
  showClient?: boolean
  showBarber?: boolean
  onCancelled?: () => void
}

export function AppointmentCard({
  appointment: apt,
  showClient,
  showBarber,
  onCancelled,
}: AppointmentCardProps) {
  const [cancelling, setCancelling] = useState(false)
  const canCancel = ['scheduled', 'confirmed'].includes(apt.status)

  const handleCancel = async () => {
    if (!confirm('Deseja cancelar este agendamento?')) return
    setCancelling(true)
    const result = await cancelAppointment(apt.id, 'Cancelado pelo usuário')
    setCancelling(false)
    if (result.success) onCancelled?.()
  }

  const scheduledDate = new Date(apt.scheduled_at)
  const barberName = apt.barber?.profile?.full_name ?? 'Barbeiro'
  const clientName = apt.client?.full_name ?? 'Cliente'
  const clientWhatsApp = apt.client?.whatsapp ?? apt.client?.phone

  return (
    <div
      className={cn(
        'rounded-xl border p-4 bg-moria-surface transition-all',
        apt.is_subscriber && 'border-gold-DEFAULT/30 shadow-[0_0_12px_rgba(201,168,76,0.08)]',
        !apt.is_subscriber && 'border-moria-border',
        apt.status === 'cancelled' && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', getAppointmentStatusColor(apt.status))}>
            {getAppointmentStatusLabel(apt.status)}
          </span>
          {apt.is_subscriber && (
            <SubscriberBadge
              planName={apt.subscription?.plan?.name}
              size="sm"
            />
          )}
        </div>

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Data e hora */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gold-DEFAULT" />
          <span className="font-medium capitalize">
            {format(scheduledDate, "EEE, dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gold-DEFAULT" />
          <span className="font-medium">{format(scheduledDate, 'HH:mm')}</span>
        </div>
      </div>

      {/* Serviços */}
      {apt.services && apt.services.length > 0 && (
        <div className="flex items-start gap-2 mb-3">
          <Scissors className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {apt.services.map(svc => (
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
                {svc.covered_by_plan && ' ✓'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Barbeiro / Cliente */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          {showClient && <span>{clientName}</span>}
          {showBarber && <span>{barberName}</span>}
        </div>

        <div className="flex items-center gap-2">
          {showClient && clientWhatsApp && (
            <a
              href={getWhatsAppUrl(clientWhatsApp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}

          {apt.total_price > 0 && (
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(apt.total_price)}
            </span>
          )}
          {apt.total_price === 0 && apt.is_subscriber && (
            <span className="text-xs text-gold-DEFAULT font-medium">Incluído no plano</span>
          )}
        </div>
      </div>
    </div>
  )
}
