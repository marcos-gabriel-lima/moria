import { describe, it, expect } from 'vitest'
import {
  startOfMonthBR,
  endOfMonthBR,
  monthRangeBR,
  startOfDayBR,
  endOfDayBR,
  todayBR,
} from '@/lib/timezone-br'

describe('startOfMonthBR — início do mês em BR como ISO UTC', () => {
  it('15/maio 12h BR (= 15h UTC) → 1/maio 00h BR (= 03h UTC)', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    expect(startOfMonthBR(now)).toBe('2026-05-01T03:00:00.000Z')
  })

  it('🐛 REGRESSÃO — não usa UTC midnight (que era o bug antigo)', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    // Bug antigo: new Date(2026, 4, 1).toISOString() = '2026-05-01T00:00:00.000Z'
    expect(startOfMonthBR(now)).not.toBe('2026-05-01T00:00:00.000Z')
  })

  it('1/maio 02h UTC (= 30/abril 23h BR) → 1/abril 00h BR', () => {
    // Caso crítico: às 02h UTC ainda é abril em BR
    const now = new Date('2026-05-01T02:00:00.000Z')
    expect(startOfMonthBR(now)).toBe('2026-04-01T03:00:00.000Z')
  })

  it('1/maio 04h UTC (= 1/maio 01h BR) → 1/maio 00h BR', () => {
    const now = new Date('2026-05-01T04:00:00.000Z')
    expect(startOfMonthBR(now)).toBe('2026-05-01T03:00:00.000Z')
  })
})

describe('endOfMonthBR — fim do mês em BR como ISO UTC', () => {
  it('15/maio 12h BR → 31/maio 23:59:59.999 BR (= 1/junho 02:59:59.999 UTC)', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    expect(endOfMonthBR(now)).toBe('2026-06-01T02:59:59.999Z')
  })

  it('🐛 REGRESSÃO — agendamento das últimas 3h do mês BR DEVE estar dentro do range', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    // Agendamento marcado pra 31/maio 22h BR = 1/junho 01h UTC
    const aptLateInMay = '2026-06-01T01:00:00.000Z'
    expect(aptLateInMay <= endOfMonthBR(now)).toBe(true)
    // Antes (bug): endOfMonth UTC = '2026-05-31T23:59:59Z' → agendamento 01:00 UTC > ficaria fora
  })

  it('fevereiro 2026 (28 dias): fim = 28/fev 23:59:59 BR = 1/mar 02:59:59 UTC', () => {
    const now = new Date('2026-02-15T12:00:00.000Z')
    expect(endOfMonthBR(now)).toBe('2026-03-01T02:59:59.999Z')
  })

  it('fevereiro 2028 (bissexto): fim = 29/fev 23:59:59 BR = 1/mar 02:59:59 UTC', () => {
    const now = new Date('2028-02-15T12:00:00.000Z')
    expect(endOfMonthBR(now)).toBe('2028-03-01T02:59:59.999Z')
  })
})

describe('monthRangeBR — N meses atrás', () => {
  it('monthsAgo=0 retorna mês atual BR', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    expect(monthRangeBR(now, 0)).toEqual({
      start: '2026-05-01T03:00:00.000Z',
      end:   '2026-06-01T02:59:59.999Z',
    })
  })

  it('monthsAgo=1 retorna mês anterior', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    const range = monthRangeBR(now, 1)
    expect(range.start).toBe('2026-04-01T03:00:00.000Z')
    expect(range.end).toBe('2026-05-01T02:59:59.999Z')
  })

  it('virada de ano: monthsAgo=1 em janeiro = dezembro do ano anterior', () => {
    const now = new Date('2026-01-15T12:00:00.000Z')
    const range = monthRangeBR(now, 1)
    expect(range.start).toBe('2025-12-01T03:00:00.000Z')
  })

  it('faixa abrange exatamente um mês BR (sem gaps ou overlaps)', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    const may  = monthRangeBR(now, 0)
    const apr  = monthRangeBR(now, 1)
    // Fim de abril + 1ms = início de maio
    expect(new Date(apr.end).getTime() + 1).toBe(new Date(may.start).getTime())
  })
})

describe('startOfDayBR / endOfDayBR', () => {
  it('15/maio 15h UTC (= 12h BR) → dia 15 BR começa às 15/maio 03h UTC', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    expect(startOfDayBR(now)).toBe('2026-05-15T03:00:00.000Z')
    expect(endOfDayBR(now)).toBe('2026-05-16T02:59:59.999Z')
  })

  it('🐛 REGRESSÃO — 26/maio 01h UTC = 25/maio 22h BR → dia BR = 25', () => {
    const now = new Date('2026-05-26T01:00:00.000Z')
    expect(startOfDayBR(now)).toBe('2026-05-25T03:00:00.000Z')
    expect(endOfDayBR(now)).toBe('2026-05-26T02:59:59.999Z')
  })

  it('endOfDayBR é exatamente 24h - 1ms após startOfDayBR', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    const diff = new Date(endOfDayBR(now)).getTime() - new Date(startOfDayBR(now)).getTime()
    expect(diff).toBe(24 * 60 * 60 * 1000 - 1)
  })
})

describe('todayBR — YYYY-MM-DD em BR', () => {
  it('15/maio 12h BR → "2026-05-15"', () => {
    const now = new Date('2026-05-15T15:00:00.000Z')
    expect(todayBR(now)).toBe('2026-05-15')
  })

  it('🐛 REGRESSÃO — 26/maio 01h UTC = 25/maio 22h BR → "2026-05-25"', () => {
    const now = new Date('2026-05-26T01:00:00.000Z')
    expect(todayBR(now)).toBe('2026-05-25')
  })

  it('último dia do mês em BR', () => {
    // 1/junho 02h UTC = 31/maio 23h BR
    const now = new Date('2026-06-01T02:00:00.000Z')
    expect(todayBR(now)).toBe('2026-05-31')
  })

  it('primeiro dia do mês em BR', () => {
    // 1/junho 04h UTC = 1/junho 01h BR
    const now = new Date('2026-06-01T04:00:00.000Z')
    expect(todayBR(now)).toBe('2026-06-01')
  })
})
