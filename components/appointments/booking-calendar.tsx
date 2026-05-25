'use client'

import { useState, useEffect, useTransition } from 'react'
import { addDays, format, isSameDay, startOfToday, addHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react'
import { cn, generateTimeSlots } from '@/lib/utils'
import type { Appointment, Barber, TimeSlot } from '@/types'

interface BookingCalendarProps {
  barber: Barber & { profile: { full_name: string } }
  appointments: Appointment[]
  blockedSlots: { starts_at: string; ends_at: string }[]
  isSubscriber: boolean
  onSelectSlot: (datetime: Date) => void
  selectedSlot: Date | null
}

export function BookingCalendar({
  barber,
  appointments,
  blockedSlots,
  isSubscriber,
  onSelectSlot,
  selectedSlot,
}: BookingCalendarProps) {
  const today = startOfToday()
  const [currentDate, setCurrentDate] = useState(today)
  const [slots, setSlots] = useState<TimeSlot[]>([])

  const maxDate = isSubscriber
    ? addDays(today, 60)  // Assinante: 60 dias de antecedência
    : addDays(today, 2)   // Não-assinante: 48h (2 dias)

  const minDate = today

  useEffect(() => {
    const daySlots = generateTimeSlots(
      currentDate,
      appointments.filter(a =>
        isSameDay(new Date(a.scheduled_at), currentDate)
      ),
      blockedSlots,
      parseInt(barber.start_time?.split(':')[0] ?? '8'),
      parseInt(barber.end_time?.split(':')[0] ?? '18'),
    )
    setSlots(daySlots)
  }, [currentDate, appointments, blockedSlots, barber])

  const prevDay = () => {
    const prev = addDays(currentDate, -1)
    if (prev >= minDate) setCurrentDate(prev)
  }

  const nextDay = () => {
    const next = addDays(currentDate, 1)
    if (next <= maxDate) setCurrentDate(next)
  }

  const availableCount = slots.filter(s => s.available).length

  return (
    <div className="space-y-4">
      {/* Aviso de limite para não-assinantes */}
      {!isSubscriber && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Você pode agendar com até <strong>48 horas</strong> de antecedência.
            Assine um plano para agendar com mais antecedência.
          </p>
        </div>
      )}

      {/* Navegação de datas */}
      <div className="flex items-center justify-between bg-moria-surface rounded-lg p-3 border border-moria-border">
        <button
          onClick={prevDay}
          disabled={isSameDay(currentDate, minDate)}
          className="min-w-[40px] min-h-[40px] p-2 rounded-md hover:bg-moria-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="font-semibold text-foreground capitalize">
            {isSameDay(currentDate, today) ? 'Hoje' : format(currentDate, 'EEEE', { locale: ptBR })}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <button
          onClick={nextDay}
          disabled={isSameDay(currentDate, maxDate)}
          className="min-w-[40px] min-h-[40px] p-2 rounded-md hover:bg-moria-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Contador de slots */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>{availableCount} horários disponíveis</span>
      </div>

      {/* Grade de horários */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            disabled={!slot.available}
            onClick={() => slot.available && onSelectSlot(slot.datetime)}
            className={cn(
              'min-h-[44px] py-2 rounded-lg text-sm font-medium border transition-all duration-150',
              selectedSlot && isSameDay(slot.datetime, selectedSlot) &&
              slot.time === format(selectedSlot, 'HH:mm')
                ? 'slot-selected'
                : slot.available
                ? 'slot-available'
                : 'slot-taken'
            )}
          >
            {slot.time}
          </button>
        ))}
      </div>

      {slots.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Nenhum horário disponível neste dia
        </p>
      )}
    </div>
  )
}
