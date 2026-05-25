import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, addMinutes, setHours, setMinutes, isBefore, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TimeSlot, Appointment } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Datas ISO sem horário (YYYY-MM-DD) são interpretadas como UTC midnight pelo
// JS — em fusos negativos (BR = UTC-3) isso vira o dia anterior. Tratamos
// essas strings como datas locais.
function toLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(date)
}

export function formatDate(date: string | Date, pattern = "dd 'de' MMMM 'de' yyyy"): string {
  return format(toLocalDate(date), pattern, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm')
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const msg = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/55${cleaned}${msg}`
}

// Gera slots de 30min entre startHour e endHour
export function generateTimeSlots(
  date: Date,
  appointments: Appointment[],
  blockedSlots: { starts_at: string; ends_at: string }[],
  startHour = 8,
  endHour = 18,
  slotDuration = 30
): TimeSlot[] {
  const slots: TimeSlot[] = []
  let current = setMinutes(setHours(date, startHour), 0)
  const end = setMinutes(setHours(date, endHour), 0)
  const now = new Date()

  while (isBefore(current, end)) {
    const slotEnd = addMinutes(current, slotDuration)
    const isPast = isBefore(current, now)

    const isBooked = appointments.some(apt => {
      if (['cancelled', 'no_show'].includes(apt.status)) return false
      const aptStart = new Date(apt.scheduled_at)
      const aptEnd = addMinutes(aptStart, apt.duration_minutes)
      return (
        (isBefore(current, aptEnd) && isAfter(slotEnd, aptStart))
      )
    })

    const isBlocked = blockedSlots.some(b => {
      const blockStart = new Date(b.starts_at)
      const blockEnd = new Date(b.ends_at)
      return isBefore(current, blockEnd) && isAfter(slotEnd, blockStart)
    })

    slots.push({
      time: format(current, 'HH:mm'),
      datetime: new Date(current),
      available: !isPast && !isBooked && !isBlocked,
      isBlocked: isBlocked || isPast,
    })

    current = addMinutes(current, slotDuration)
  }

  return slots
}

export function getSubscriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    cancelled: 'Cancelado',
    expired: 'Expirado',
    pending: 'Pendente',
  }
  return labels[status] ?? status
}

export function getAppointmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não Compareceu',
  }
  return labels[status] ?? status
}

export function getAppointmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    confirmed: 'text-green-400 bg-green-950/40 border-green-800/40',
    in_progress: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40',
    completed: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    cancelled: 'text-red-400 bg-red-950/40 border-red-800/40',
    no_show: 'text-gray-400 bg-gray-950/40 border-gray-800/40',
  }
  return colors[status] ?? 'text-muted-foreground'
}

export function getDayOfWeek(date: Date): string {
  return format(date, 'EEEE', { locale: ptBR })
}

export function canBookWithAdvance(isSubscriber: boolean, targetDate: Date): boolean {
  if (isSubscriber) return true
  const hoursUntil = (targetDate.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntil <= 48
}
