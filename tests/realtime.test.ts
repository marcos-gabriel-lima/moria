import { describe, it, expect } from 'vitest'
import {
  applyInsert,
  applyUpdate,
  applyDelete,
  reconcileInitialFetch,
} from '@/lib/realtime-state'
import type { Appointment, AppointmentStatus } from '@/types'

const DATE = '2026-05-25'

function apt(over: Partial<Appointment> & { id: string; scheduled_at?: string; status?: AppointmentStatus }): Appointment {
  const base: Appointment = {
    id: 'placeholder',
    client_id: 'c1',
    barber_id: 'b1',
    subscription_id: null,
    status: 'scheduled' as AppointmentStatus,
    scheduled_at: '2026-05-25T10:00:00.000Z',
    duration_minutes: 30,
    notes: null,
    is_subscriber: false,
    checked_in_at: null,
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    total_price: 50,
    created_at: '2026-05-25T08:00:00.000Z',
    updated_at: '2026-05-25T08:00:00.000Z',
  }
  return { ...base, ...over }
}

describe('applyInsert', () => {
  it('adiciona agendamento do dia correto', () => {
    const out = applyInsert([], apt({ id: 'a1' }), DATE)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('a1')
  })

  it('🐛 BUG B FIXED — ignora insert de outro dia', () => {
    const out = applyInsert(
      [],
      apt({ id: 'a1', scheduled_at: '2026-05-26T10:00:00.000Z' }),
      DATE,
    )
    expect(out).toEqual([])
  })

  it('ignora insert de status cancelado', () => {
    const out = applyInsert([], apt({ id: 'a1', status: 'cancelled' }), DATE)
    expect(out).toEqual([])
  })

  it('ignora insert de no_show', () => {
    const out = applyInsert([], apt({ id: 'a1', status: 'no_show' }), DATE)
    expect(out).toEqual([])
  })

  it('é idempotente: não duplica quando o mesmo evento chega 2x', () => {
    const first = applyInsert([], apt({ id: 'a1' }), DATE)
    const second = applyInsert(first, apt({ id: 'a1' }), DATE)
    expect(second).toHaveLength(1)
  })

  it('mantém ordenação por horário', () => {
    const list = [apt({ id: 'a1', scheduled_at: '2026-05-25T14:00:00.000Z' })]
    const out = applyInsert(list, apt({ id: 'a2', scheduled_at: '2026-05-25T10:00:00.000Z' }), DATE)
    expect(out.map(a => a.id)).toEqual(['a2', 'a1'])
  })
})

describe('applyUpdate', () => {
  it('atualiza in-place quando o agendamento existe', () => {
    const prev = [apt({ id: 'a1', status: 'scheduled' })]
    const out = applyUpdate(prev, apt({ id: 'a1', status: 'confirmed' }), DATE)
    expect(out[0].status).toBe('confirmed')
    expect(out).toHaveLength(1)
  })

  it('remove da lista quando o status vira "cancelled"', () => {
    const prev = [apt({ id: 'a1', status: 'scheduled' })]
    const out = applyUpdate(prev, apt({ id: 'a1', status: 'cancelled' }), DATE)
    expect(out).toEqual([])
  })

  it('remove da lista quando o status vira "no_show"', () => {
    const prev = [apt({ id: 'a1' })]
    const out = applyUpdate(prev, apt({ id: 'a1', status: 'no_show' }), DATE)
    expect(out).toEqual([])
  })

  it('remove da lista quando o agendamento é reagendado pra outro dia', () => {
    const prev = [apt({ id: 'a1' })]
    const out = applyUpdate(
      prev,
      apt({ id: 'a1', scheduled_at: '2026-05-26T10:00:00.000Z' }),
      DATE,
    )
    expect(out).toEqual([])
  })

  it('SELF-HEALING: UPDATE sem INSERT anterior adiciona o agendamento', () => {
    const out = applyUpdate([], apt({ id: 'a1', status: 'confirmed' }), DATE)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('a1')
  })

  it('reordena por horário após update que muda o scheduled_at', () => {
    const prev = [
      apt({ id: 'a1', scheduled_at: '2026-05-25T10:00:00.000Z' }),
      apt({ id: 'a2', scheduled_at: '2026-05-25T14:00:00.000Z' }),
    ]
    const out = applyUpdate(
      prev,
      apt({ id: 'a1', scheduled_at: '2026-05-25T16:00:00.000Z' }),
      DATE,
    )
    expect(out.map(a => a.id)).toEqual(['a2', 'a1'])
  })

  it('NÃO adiciona update de outro dia (mesmo com self-healing)', () => {
    const out = applyUpdate(
      [],
      apt({ id: 'a1', scheduled_at: '2026-05-26T10:00:00.000Z' }),
      DATE,
    )
    expect(out).toEqual([])
  })
})

describe('applyDelete', () => {
  it('remove o agendamento pelo id', () => {
    const prev = [apt({ id: 'a1' }), apt({ id: 'a2' })]
    const out = applyDelete(prev, 'a1')
    expect(out.map(a => a.id)).toEqual(['a2'])
  })

  it('lista vazia: retorna lista vazia', () => {
    expect(applyDelete([], 'a1')).toEqual([])
  })

  it('id inexistente: não altera a lista', () => {
    const prev = [apt({ id: 'a1' })]
    const out = applyDelete(prev, 'a999')
    expect(out).toEqual(prev)
  })
})

describe('reconcileInitialFetch — RACE CONDITION FIX', () => {
  it('🐛 BUG A FIXED — preserva insert do realtime que chegou antes do fetch retornar', () => {
    // Cenário do bug:
    //   1. Componente monta, dispara fetch (assíncrono)
    //   2. Cliente cria agendamento → INSERT chega via realtime → estado = [a1]
    //   3. Fetch retorna SEM o a1 (replication lag)
    //   4. Sem reconcile, a1 sumiria. Com reconcile, é preservado.
    const realtimeInsert = [apt({ id: 'a1' })]
    const fetchSemA1: Appointment[] = []
    const out = reconcileInitialFetch(fetchSemA1, realtimeInsert, DATE)
    expect(out.map(a => a.id)).toEqual(['a1'])
  })

  it('mescla fetch + estado atual sem duplicar', () => {
    const fetched = [apt({ id: 'a1', scheduled_at: '2026-05-25T10:00:00.000Z' })]
    const current = [apt({ id: 'a2', scheduled_at: '2026-05-25T14:00:00.000Z' })]
    const out = reconcileInitialFetch(fetched, current, DATE)
    expect(out.map(a => a.id)).toEqual(['a1', 'a2'])
  })

  it('versão do fetch ganha em caso de duplicata (mais autoritativa)', () => {
    const fetched = [apt({ id: 'a1', status: 'completed', total_price: 999 })]
    const current = [apt({ id: 'a1', status: 'scheduled', total_price: 50 })]
    const out = reconcileInitialFetch(fetched, current, DATE)
    expect(out[0].status).toBe('completed')
    expect(out[0].total_price).toBe(999)
  })

  it('descarta cancelados do estado atual', () => {
    const current = [apt({ id: 'a1', status: 'cancelled' })]
    const out = reconcileInitialFetch([], current, DATE)
    expect(out).toEqual([])
  })

  it('descarta agendamentos de outro dia', () => {
    const current = [apt({ id: 'a1', scheduled_at: '2026-05-26T10:00:00.000Z' })]
    const out = reconcileInitialFetch([], current, DATE)
    expect(out).toEqual([])
  })

  it('ordena resultado por horário', () => {
    const fetched = [
      apt({ id: 'a1', scheduled_at: '2026-05-25T14:00:00.000Z' }),
      apt({ id: 'a2', scheduled_at: '2026-05-25T09:00:00.000Z' }),
    ]
    const out = reconcileInitialFetch(fetched, [], DATE)
    expect(out.map(a => a.id)).toEqual(['a2', 'a1'])
  })
})
