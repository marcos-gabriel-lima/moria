'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  applyDelete,
  applyInsert,
  applyUpdate,
  reconcileInitialFetch,
} from '@/lib/realtime-state'
import type { Appointment } from '@/types'

export function useRealtimeAppointments(barberId: string, date: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const supabase = createClient()
  // Ref pra detectar se a busca inicial foi superada por eventos do realtime.
  const fetchedAtRef = useRef<number>(0)

  useEffect(() => {
    // Filtro local de dia usa YYYY-MM-DD (timezone do navegador / Supabase trata UTC).
    const dayStart = `${date}T00:00:00.000Z`
    const dayEnd   = `${date}T23:59:59.999Z`

    let cancelled = false
    const mountedAt = Date.now()
    fetchedAtRef.current = 0

    // Busca inicial — pode ser superada por eventos realtime (race condition).
    // Por isso usamos reconcileInitialFetch pra preservar inserts que chegaram antes.
    supabase
      .from('appointments')
      .select(
        '*, client:profiles(full_name, phone, whatsapp), services:appointment_services(*, service:services(*))',
      )
      .eq('barber_id', barberId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .not('status', 'in', '("cancelled","no_show")')
      .then(({ data }) => {
        if (cancelled || !data) return
        fetchedAtRef.current = mountedAt
        setAppointments(prev =>
          reconcileInitialFetch(data as unknown as Appointment[], prev, date),
        )
      })

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
          if (cancelled) return
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => applyInsert(prev, payload.new as Appointment, date))
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev => applyUpdate(prev, payload.new as Appointment, date))
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id
            if (oldId) setAppointments(prev => applyDelete(prev, oldId))
          }
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [barberId, date])

  return appointments
}
