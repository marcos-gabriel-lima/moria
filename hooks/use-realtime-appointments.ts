'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types'

export function useRealtimeAppointments(barberId: string, date: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const supabase = createClient()

  useEffect(() => {
    const dayStart = `${date}T00:00:00.000Z`
    const dayEnd = `${date}T23:59:59.999Z`

    // Busca inicial
    supabase
      .from('appointments')
      .select('*, client:profiles(full_name, phone, whatsapp), services:appointment_services(*, service:services(*))')
      .eq('barber_id', barberId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .not('status', 'in', '("cancelled","no_show")')
      .then(({ data }) => {
        if (data) setAppointments(data as unknown as Appointment[])
      })

    // Subscribe para atualizações em tempo real
    const channel = supabase
      .channel(`appointments:barber:${barberId}:${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `barber_id=eq.${barberId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => [...prev, payload.new as Appointment].sort(
              (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            ))
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev =>
              prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a)
            )
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [barberId, date])

  return appointments
}
