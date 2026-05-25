import { describe, it, expect } from 'vitest'
import {
  calculateExpiry,
  isValidBillingPeriod,
  ONE_MONTH,
  THREE_MONTHS,
  SIX_MONTHS,
  ONE_YEAR,
} from '@/lib/billing'

describe('calculateExpiry — meses', () => {
  it('1 mês a partir de 15/jan → 15/fev', () => {
    const from = new Date(2026, 0, 15)
    const out  = calculateExpiry(from, { unit: 'months', value: 1 })
    expect(out.getFullYear()).toBe(2026)
    expect(out.getMonth()).toBe(1)
    expect(out.getDate()).toBe(15)
  })

  it('ajusta fim de mês: 31/jan + 1 mês = 28/fev (ano comum)', () => {
    const from = new Date(2026, 0, 31) // jan 2026 não é bissexto
    const out  = calculateExpiry(from, { unit: 'months', value: 1 })
    expect(out.getMonth()).toBe(1)
    expect(out.getDate()).toBe(28)
  })

  it('ajusta fim de mês: 31/jan + 1 mês = 29/fev (ano bissexto)', () => {
    const from = new Date(2028, 0, 31) // 2028 é bissexto
    const out  = calculateExpiry(from, { unit: 'months', value: 1 })
    expect(out.getMonth()).toBe(1)
    expect(out.getDate()).toBe(29)
  })

  it('3 meses', () => {
    const from = new Date(2026, 0, 15)
    const out  = calculateExpiry(from, THREE_MONTHS)
    expect(out.getMonth()).toBe(3) // abril
    expect(out.getDate()).toBe(15)
  })

  it('6 meses', () => {
    const from = new Date(2026, 0, 15)
    const out  = calculateExpiry(from, SIX_MONTHS)
    expect(out.getMonth()).toBe(6) // julho
    expect(out.getDate()).toBe(15)
  })

  it('12 meses = 1 ano completo', () => {
    const from = new Date(2026, 0, 15)
    const out  = calculateExpiry(from, { unit: 'months', value: 12 })
    expect(out.getFullYear()).toBe(2027)
    expect(out.getMonth()).toBe(0)
  })
})

describe('calculateExpiry — dias', () => {
  it('30 dias a partir de 1/jan = 31/jan', () => {
    const from = new Date(2026, 0, 1)
    const out  = calculateExpiry(from, { unit: 'days', value: 30 })
    expect(out.getDate()).toBe(31)
  })

  it('🐛 REGRESSÃO — 30 dias != 1 mês para mês de 31 dias', () => {
    const from = new Date(2026, 0, 1) // 1/jan
    const days30   = calculateExpiry(from, { unit: 'days',   value: 30 })
    const oneMonth = calculateExpiry(from, ONE_MONTH)
    // 30 dias = 31/jan, 1 mês = 1/fev (1 dia depois)
    expect(days30.getTime()).not.toBe(oneMonth.getTime())
    expect(days30.getDate()).toBe(31)
    expect(oneMonth.getDate()).toBe(1)
    expect(oneMonth.getMonth()).toBe(1) // fev
  })
})

describe('calculateExpiry — anos', () => {
  it('1 ano a partir de 15/jan/2026 = 15/jan/2027', () => {
    const from = new Date(2026, 0, 15)
    const out  = calculateExpiry(from, ONE_YEAR)
    expect(out.getFullYear()).toBe(2027)
    expect(out.getMonth()).toBe(0)
    expect(out.getDate()).toBe(15)
  })

  it('1 ano partindo de 29/fev (bissexto) → 28/fev (não bissexto)', () => {
    const from = new Date(2028, 1, 29)
    const out  = calculateExpiry(from, ONE_YEAR)
    expect(out.getFullYear()).toBe(2029)
    expect(out.getMonth()).toBe(1)
    expect(out.getDate()).toBe(28)
  })
})

describe('calculateExpiry — validação', () => {
  it('valor zero lança erro', () => {
    expect(() => calculateExpiry(new Date(), { unit: 'months', value: 0 })).toThrow()
  })

  it('valor negativo lança erro', () => {
    expect(() => calculateExpiry(new Date(), { unit: 'months', value: -1 })).toThrow()
  })

  it('valor não-inteiro lança erro', () => {
    expect(() => calculateExpiry(new Date(), { unit: 'months', value: 1.5 })).toThrow()
  })
})

describe('isValidBillingPeriod', () => {
  it('aceita formatos válidos', () => {
    expect(isValidBillingPeriod({ unit: 'months', value: 1 })).toBe(true)
    expect(isValidBillingPeriod({ unit: 'days',   value: 30 })).toBe(true)
    expect(isValidBillingPeriod({ unit: 'years',  value: 1 })).toBe(true)
  })

  it('rejeita unit desconhecida', () => {
    expect(isValidBillingPeriod({ unit: 'weeks', value: 4 })).toBe(false)
  })

  it('rejeita value zero ou negativo', () => {
    expect(isValidBillingPeriod({ unit: 'months', value: 0 })).toBe(false)
    expect(isValidBillingPeriod({ unit: 'months', value: -1 })).toBe(false)
  })

  it('rejeita value não-inteiro', () => {
    expect(isValidBillingPeriod({ unit: 'months', value: 1.5 })).toBe(false)
  })

  it('rejeita value acima de 365 (proteção contra abuso)', () => {
    expect(isValidBillingPeriod({ unit: 'days', value: 366 })).toBe(false)
  })

  it('rejeita null/undefined/string/array', () => {
    expect(isValidBillingPeriod(null)).toBe(false)
    expect(isValidBillingPeriod(undefined)).toBe(false)
    expect(isValidBillingPeriod('1mes')).toBe(false)
    expect(isValidBillingPeriod([{ unit: 'months', value: 1 }])).toBe(false)
  })

  it('rejeita objeto sem campos obrigatórios', () => {
    expect(isValidBillingPeriod({ unit: 'months' })).toBe(false)
    expect(isValidBillingPeriod({ value: 1 })).toBe(false)
    expect(isValidBillingPeriod({})).toBe(false)
  })
})

describe('Constantes de conveniência', () => {
  it('ONE_MONTH = 1 mês', () => {
    expect(ONE_MONTH).toEqual({ unit: 'months', value: 1 })
  })

  it('ONE_YEAR = 1 ano', () => {
    expect(ONE_YEAR).toEqual({ unit: 'years', value: 1 })
  })

  it('SIX_MONTHS produz mesmo resultado que months:6 explícito', () => {
    const from = new Date(2026, 5, 15)
    expect(calculateExpiry(from, SIX_MONTHS).getTime())
      .toBe(calculateExpiry(from, { unit: 'months', value: 6 }).getTime())
  })
})
