import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatTime,
  getWhatsAppUrl,
  canBookWithAdvance,
  generateTimeSlots,
  getSubscriptionStatusLabel,
  getAppointmentStatusLabel,
} from '@/lib/utils'
import type { Appointment } from '@/types'

describe('formatCurrency', () => {
  it('formata valor inteiro em BRL', () => {
    const result = formatCurrency(150)
    expect(result).toMatch(/R\$\s?150,00/)
  })

  it('formata valor com centavos', () => {
    const result = formatCurrency(89.9)
    expect(result).toMatch(/R\$\s?89,90/)
  })

  it('formata zero', () => {
    const result = formatCurrency(0)
    expect(result).toMatch(/R\$\s?0,00/)
  })

  it('formata valores grandes com separador de milhar', () => {
    const result = formatCurrency(1500)
    expect(result).toMatch(/R\$\s?1\.500,00/)
  })
})

describe('formatDate', () => {
  it('formata data em português por extenso (com horário explícito)', () => {
    // Usamos horário do meio-dia pra evitar ambiguidade de timezone
    const result = formatDate('2026-05-25T12:00:00')
    expect(result).toContain('25')
    expect(result.toLowerCase()).toContain('maio')
    expect(result).toContain('2026')
  })

  it('aceita objeto Date', () => {
    const result = formatDate(new Date('2026-01-15T12:00:00'))
    expect(result).toContain('15')
    expect(result.toLowerCase()).toContain('janeiro')
  })

  // Regressão do bug de timezone: data ISO pura (YYYY-MM-DD) deve ser
  // interpretada como data local, não UTC midnight.
  it('data ISO pura (YYYY-MM-DD) não sofre shift de timezone', () => {
    const result = formatDate('2026-05-25')
    expect(result).toBe('25 de maio de 2026')
  })

  it('data ISO pura no primeiro dia do mês não vira mês anterior', () => {
    const result = formatDate('2026-06-01')
    expect(result).toBe('01 de junho de 2026')
  })
})

describe('formatTime', () => {
  it('formata hora no padrão HH:mm', () => {
    expect(formatTime('2026-05-25T14:30:00')).toBe('14:30')
  })

  it('formata 00:00', () => {
    expect(formatTime('2026-05-25T00:00:00')).toBe('00:00')
  })
})

describe('getWhatsAppUrl', () => {
  it('gera URL com prefixo 55 (Brasil)', () => {
    const url = getWhatsAppUrl('11999998888')
    expect(url).toBe('https://wa.me/5511999998888')
  })

  it('remove caracteres não numéricos do telefone', () => {
    const url = getWhatsAppUrl('(11) 99999-8888')
    expect(url).toBe('https://wa.me/5511999998888')
  })

  it('inclui mensagem URL-encoded quando fornecida', () => {
    const url = getWhatsAppUrl('11999998888', 'Olá, MORIA!')
    expect(url).toContain('https://wa.me/5511999998888')
    expect(url).toContain('?text=')
    expect(url).toContain(encodeURIComponent('Olá, MORIA!'))
  })

  it('não inclui ?text= quando mensagem não é passada', () => {
    const url = getWhatsAppUrl('11999998888')
    expect(url).not.toContain('?text=')
  })
})

describe('canBookWithAdvance — REGRA 48H', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-25T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('assinante pode marcar qualquer horário no futuro', () => {
    const daquiAUmaSemana = new Date('2026-06-01T12:00:00')
    expect(canBookWithAdvance(true, daquiAUmaSemana)).toBe(true)
  })

  it('assinante pode marcar pra daqui 2h', () => {
    const daqui2h = new Date('2026-05-25T14:00:00')
    expect(canBookWithAdvance(true, daqui2h)).toBe(true)
  })

  it('NÃO-assinante NÃO pode marcar pra daqui 1 semana (>48h)', () => {
    const daquiAUmaSemana = new Date('2026-06-01T12:00:00')
    expect(canBookWithAdvance(false, daquiAUmaSemana)).toBe(false)
  })

  it('NÃO-assinante PODE marcar pra daqui 2h (<48h)', () => {
    const daqui2h = new Date('2026-05-25T14:00:00')
    expect(canBookWithAdvance(false, daqui2h)).toBe(true)
  })

  it('NÃO-assinante PODE marcar pra daqui 24h (<48h)', () => {
    const daqui24h = new Date('2026-05-26T12:00:00')
    expect(canBookWithAdvance(false, daqui24h)).toBe(true)
  })

  it('NÃO-assinante NÃO pode marcar pra daqui 72h (>48h)', () => {
    const daqui72h = new Date('2026-05-28T12:00:00')
    expect(canBookWithAdvance(false, daqui72h)).toBe(false)
  })

  it('caso limite: exatamente 48h é permitido pra não-assinante', () => {
    const exatamente48h = new Date('2026-05-27T12:00:00')
    expect(canBookWithAdvance(false, exatamente48h)).toBe(true)
  })
})

describe('generateTimeSlots', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Travamos o "agora" antes do início do expediente pra evitar slots no passado
    vi.setSystemTime(new Date('2026-05-25T07:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const date = new Date('2026-05-25T12:00:00')

  it('gera 20 slots de 30min entre 8h e 18h por padrão', () => {
    const slots = generateTimeSlots(date, [], [])
    expect(slots).toHaveLength(20)
    expect(slots[0].time).toBe('08:00')
    expect(slots[slots.length - 1].time).toBe('17:30')
  })

  it('respeita startHour e endHour customizados', () => {
    const slots = generateTimeSlots(date, [], [], 9, 12)
    expect(slots).toHaveLength(6) // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
    expect(slots[0].time).toBe('09:00')
    expect(slots[slots.length - 1].time).toBe('11:30')
  })

  it('marca slot como indisponível quando há agendamento conflitante', () => {
    const apt: Partial<Appointment> = {
      scheduled_at: '2026-05-25T10:00:00',
      duration_minutes: 30,
      status: 'scheduled',
    }
    const slots = generateTimeSlots(date, [apt as Appointment], [])
    const slot10 = slots.find(s => s.time === '10:00')
    expect(slot10?.available).toBe(false)
  })

  it('ignora agendamentos cancelados', () => {
    const apt: Partial<Appointment> = {
      scheduled_at: '2026-05-25T10:00:00',
      duration_minutes: 30,
      status: 'cancelled',
    }
    const slots = generateTimeSlots(date, [apt as Appointment], [])
    const slot10 = slots.find(s => s.time === '10:00')
    expect(slot10?.available).toBe(true)
  })

  it('marca slots como bloqueados quando há blocked_slot cobrindo o horário', () => {
    const blocked = [{ starts_at: '2026-05-25T12:00:00', ends_at: '2026-05-25T13:00:00' }]
    const slots = generateTimeSlots(date, [], blocked)
    const slot1200 = slots.find(s => s.time === '12:00')
    const slot1230 = slots.find(s => s.time === '12:30')
    expect(slot1200?.isBlocked).toBe(true)
    expect(slot1200?.available).toBe(false)
    expect(slot1230?.isBlocked).toBe(true)
  })

  it('🛡️ maxBookingDate: slots após o cap ficam indisponíveis', () => {
    // Cap às 12:00 — slots 12:30+ devem estar bloqueados
    const cap = new Date('2026-05-25T12:00:00')
    const slots = generateTimeSlots(date, [], [], 8, 18, 30, cap)
    expect(slots.find(s => s.time === '11:30')?.available).toBe(true)
    expect(slots.find(s => s.time === '12:30')?.available).toBe(false)
    expect(slots.find(s => s.time === '12:30')?.isBlocked).toBe(true)
    expect(slots.find(s => s.time === '17:30')?.available).toBe(false)
  })

  it('🐛 REGRESSÃO 48h — não-assinante: slots além de 48h ficam indisponíveis', () => {
    // Cenário: hoje 26/mai 22h, calendário mostra 28/mai
    // Slot 28/mai 23h é 49h depois → DEVE estar indisponível
    vi.setSystemTime(new Date('2026-05-26T22:00:00'))
    const targetDate  = new Date('2026-05-28T12:00:00')
    const cap48hAhead = new Date('2026-05-28T22:00:00') // exatamente +48h
    const slots = generateTimeSlots(targetDate, [], [], 8, 24, 30, cap48hAhead)
    expect(slots.find(s => s.time === '21:30')?.available).toBe(true)
    expect(slots.find(s => s.time === '22:30')?.available).toBe(false)
    expect(slots.find(s => s.time === '23:30')?.available).toBe(false)
  })

  it('sem maxBookingDate (assinante): nenhum slot é capado', () => {
    const slots = generateTimeSlots(date, [], [], 8, 18)
    // Todos disponíveis (sem appointments, sem blocked)
    expect(slots.every(s => s.available)).toBe(true)
  })

  it('agendamento longo (60min) bloqueia 2 slots consecutivos', () => {
    const apt: Partial<Appointment> = {
      scheduled_at: '2026-05-25T14:00:00',
      duration_minutes: 60,
      status: 'confirmed',
    }
    const slots = generateTimeSlots(date, [apt as Appointment], [])
    expect(slots.find(s => s.time === '14:00')?.available).toBe(false)
    expect(slots.find(s => s.time === '14:30')?.available).toBe(false)
    expect(slots.find(s => s.time === '15:00')?.available).toBe(true)
  })
})

describe('getSubscriptionStatusLabel', () => {
  it('traduz status ativo', () => {
    expect(getSubscriptionStatusLabel('active')).toBe('Ativo')
  })

  it('traduz status cancelado', () => {
    expect(getSubscriptionStatusLabel('cancelled')).toBe('Cancelado')
  })

  it('retorna o próprio status quando não conhecido', () => {
    expect(getSubscriptionStatusLabel('foo')).toBe('foo')
  })
})

describe('getAppointmentStatusLabel', () => {
  it('traduz agendado', () => {
    expect(getAppointmentStatusLabel('scheduled')).toBe('Agendado')
  })

  it('traduz concluído', () => {
    expect(getAppointmentStatusLabel('completed')).toBe('Concluído')
  })

  it('traduz não compareceu', () => {
    expect(getAppointmentStatusLabel('no_show')).toBe('Não Compareceu')
  })
})
