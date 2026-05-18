'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { User, Scissors, Check, Calendar, AlertCircle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { BookingCalendar } from './booking-calendar'
import { createAppointment, getAvailableSlots } from '@/actions/appointments'
import type { Barber, Service, Subscription, Appointment } from '@/types'

interface NewAppointmentFormProps {
  barbers: (Barber & { profile: { id: string; full_name: string; avatar_url: string | null } })[]
  services: Service[]
  subscription: Subscription | null
}

export function NewAppointmentForm({ barbers, services, subscription }: NewAppointmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedBarber, setSelectedBarber] = useState<typeof barbers[0] | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [blockedSlots, setBlockedSlots] = useState<{ starts_at: string; ends_at: string }[]>([])

  const isSubscriber = !!subscription
  const plan = subscription?.plan as { includes_cut: boolean; includes_beard: boolean } | null

  // Ao selecionar barbeiro + data, buscar horários ocupados
  useEffect(() => {
    if (!selectedBarber || !selectedSlot) return
    const dateStr = format(selectedSlot, 'yyyy-MM-dd')
    getAvailableSlots(selectedBarber.id, dateStr).then(res => {
      if (res.success) {
        setAppointments(
          res.data.slots.map(s => ({ scheduled_at: s, duration_minutes: 30 } as Appointment))
        )
        setBlockedSlots(res.data.blocked)
      }
    })
  }, [selectedBarber, selectedSlot])

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id))

  const totalPrice = selectedServiceObjects.reduce((sum, s) => {
    const coveredByPlan = plan
      ? (s.covered_by_cut && plan.includes_cut) ||
        (s.covered_by_beard && plan.includes_beard)
      : false
    return sum + (coveredByPlan ? 0 : s.price)
  }, 0)

  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration_minutes, 0)

  const handleSubmit = () => {
    if (!selectedBarber || !selectedSlot || !selectedServices.length) return
    setError('')
    startTransition(async () => {
      const result = await createAppointment({
        barber_id: selectedBarber.id,
        service_ids: selectedServices,
        scheduled_at: selectedSlot.toISOString(),
      })
      if (!result.success) { setError(result.error); return }
      router.push('/appointments?success=1')
    })
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Barbeiro */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gold-DEFAULT">
            <span className="w-5 h-5 rounded-full bg-gold-DEFAULT text-black flex items-center justify-center text-xs">1</span>
            Escolha o barbeiro
          </div>

          <div className="grid gap-3">
            {barbers.map(barber => (
              <button
                key={barber.id}
                onClick={() => { setSelectedBarber(barber); setStep(2) }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                  selectedBarber?.id === barber.id
                    ? 'border-gold-DEFAULT bg-gold-DEFAULT/5'
                    : 'border-moria-border bg-moria-surface hover:border-gold-DEFAULT/40'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center shrink-0">
                  {barber.profile.avatar_url ? (
                    <img src={barber.profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{barber.profile.full_name}</p>
                  {barber.specialty && (
                    <p className="text-xs text-muted-foreground">{barber.specialty.join(' • ')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Serviços */}
      {step === 2 && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-gold-DEFAULT">
            <span className="w-5 h-5 rounded-full bg-gold-DEFAULT text-black flex items-center justify-center text-xs">2</span>
            Selecione os serviços
          </div>

          <div className="grid gap-2">
            {services.map(svc => {
              const isSelected = selectedServices.includes(svc.id)
              const coveredByPlan = plan
                ? (svc.covered_by_cut && plan.includes_cut) ||
                  (svc.covered_by_beard && plan.includes_beard)
                : false

              return (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={cn(
                    'flex items-center justify-between p-3.5 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-gold-DEFAULT bg-gold-DEFAULT/5'
                      : 'border-moria-border bg-moria-surface hover:border-gold-DEFAULT/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center transition-all',
                      isSelected ? 'bg-gold-DEFAULT border-gold-DEFAULT' : 'border-moria-border'
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{svc.duration_minutes} min</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {coveredByPlan ? (
                      <span className="text-xs text-gold-DEFAULT font-medium">No plano ✓</span>
                    ) : (
                      <span className="text-sm font-semibold">{formatCurrency(svc.price)}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {selectedServices.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-moria-elevated border border-moria-border text-sm">
              <span className="text-muted-foreground">Total: {totalDuration}min</span>
              <span className="font-bold">{totalPrice === 0 ? 'Incluído no plano' : formatCurrency(totalPrice)}</span>
            </div>
          )}

          <button
            onClick={() => { if (selectedServices.length) setStep(3) }}
            disabled={!selectedServices.length}
            className="w-full py-3 rounded-xl bg-gold-gradient text-black font-bold disabled:opacity-40 hover:opacity-90 transition-all"
          >
            Escolher horário →
          </button>
        </div>
      )}

      {/* Step 3: Horário */}
      {step === 3 && selectedBarber && (
        <div className="space-y-4">
          <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-gold-DEFAULT">
            <span className="w-5 h-5 rounded-full bg-gold-DEFAULT text-black flex items-center justify-center text-xs">3</span>
            Escolha o horário
          </div>

          <BookingCalendar
            barber={selectedBarber as any}
            appointments={appointments}
            blockedSlots={blockedSlots}
            isSubscriber={isSubscriber}
            onSelectSlot={setSelectedSlot}
            selectedSlot={selectedSlot}
          />

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedSlot || isPending}
            className="w-full py-3 rounded-xl bg-gold-gradient text-black font-bold disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {isPending ? 'Agendando...' : 'Confirmar Agendamento'}
          </button>
        </div>
      )}
    </div>
  )
}
