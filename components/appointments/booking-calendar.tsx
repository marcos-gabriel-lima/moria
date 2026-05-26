'use client'

import { useEffect, useState } from 'react'
import { addDays, addHours, format, isSameDay, startOfToday } from 'date-fns'
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
  onDateChange?: (date: Date) => void
  selectedSlot: Date | null
}

// Não-assinante: regra real de 48h CORRIDAS a partir de agora,
// não "2 dias do calendário" (que dava brecha em horas tardias do dia).
const NON_SUBSCRIBER_BOOKING_HOURS_AHEAD = 48
const SUBSCRIBER_BOOKING_DAYS_AHEAD     = 60

export function BookingCalendar({
  barber,
  appointments,
  blockedSlots,
  isSubscriber,
  onSelectSlot,
  onDateChange,
  selectedSlot,
}: BookingCalendarProps) {
  const today = startOfToday()
  const [currentDate, setCurrentDate] = useState(today)
  const [slots, setSlots] = useState<TimeSlot[]>([])

  // Cap real de horas. Pra UX do calendário (selecionar dia), arredondamos pro
  // último dia que tem AO MENOS UM slot disponível.
  const now = new Date()
  const maxBookingDate = isSubscriber
    ? addDays(today, SUBSCRIBER_BOOKING_DAYS_AHEAD)
    : addHours(now, NON_SUBSCRIBER_BOOKING_HOURS_AHEAD)

  const minDate = today

  // Avisa o parent quando muda o dia visualizado — pra parent re-fetchar
  // appointments e blocked-slots desse dia.
  useEffect(() => {
    onDateChange?.(currentDate)
  }, [currentDate, onDateChange])

  useEffect(() => {
    const daySlots = generateTimeSlots(
      currentDate,
      appointments.filter(a =>
        isSameDay(new Date(a.scheduled_at), currentDate)
      ),
      blockedSlots,
      parseInt(barber.start_time?.split(':')[0] ?? '8'),
      parseInt(barber.end_time?.split(':')[0] ?? '18'),
      30,
      maxBookingDate,
    )
    setSlots(daySlots)
  // maxBookingDate deriva de `now` que muda a cada render — não incluímos
  // nas deps. O recálculo já acontece quando muda data/barbeiro/dados.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, appointments, blockedSlots, barber, isSubscriber])

  const prevDay = () => {
    const prev = addDays(currentDate, -1)
    if (prev >= minDate) setCurrentDate(prev)
  }

  const nextDay = () => {
    const next = addDays(currentDate, 1)
    // Só permite navegar pra um dia que ainda contém slots válidos
    if (next <= maxBookingDate) setCurrentDate(next)
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
          disabled={addDays(currentDate, 1) > maxBookingDate}
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
