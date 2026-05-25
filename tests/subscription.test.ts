import { describe, it, expect } from 'vitest'
import { isServiceCoveredByPlan, calculateAppointmentPrice } from '@/lib/pricing'

// ── Fixtures ───────────────────────────────────────────────
const corte = {
  id: 'svc-corte',
  price: 60,
  duration_minutes: 30,
  covered_by_cut: true,
  covered_by_beard: false,
}
const barba = {
  id: 'svc-barba',
  price: 40,
  duration_minutes: 20,
  covered_by_cut: false,
  covered_by_beard: true,
}
const sobrancelha = {
  id: 'svc-sobr',
  price: 25,
  duration_minutes: 15,
  covered_by_cut: false,
  covered_by_beard: false,
}

const planoCorte         = { plan: { includes_cut: true,  includes_beard: false } }
const planoBarba         = { plan: { includes_cut: false, includes_beard: true  } }
const planoCorteEBarba   = { plan: { includes_cut: true,  includes_beard: true  } }

describe('isServiceCoveredByPlan', () => {
  it('cliente sem plano: nenhum serviço é coberto', () => {
    expect(isServiceCoveredByPlan(corte, null)).toBe(false)
    expect(isServiceCoveredByPlan(corte, undefined)).toBe(false)
    expect(isServiceCoveredByPlan(corte, { plan: null })).toBe(false)
  })

  it('plano Corte cobre corte mas NÃO barba', () => {
    expect(isServiceCoveredByPlan(corte, planoCorte)).toBe(true)
    expect(isServiceCoveredByPlan(barba, planoCorte)).toBe(false)
  })

  it('plano Barba cobre barba mas NÃO corte', () => {
    expect(isServiceCoveredByPlan(barba, planoBarba)).toBe(true)
    expect(isServiceCoveredByPlan(corte, planoBarba)).toBe(false)
  })

  it('plano Corte+Barba cobre ambos', () => {
    expect(isServiceCoveredByPlan(corte, planoCorteEBarba)).toBe(true)
    expect(isServiceCoveredByPlan(barba, planoCorteEBarba)).toBe(true)
  })

  it('serviço extra (sobrancelha) NUNCA é coberto', () => {
    expect(isServiceCoveredByPlan(sobrancelha, planoCorte)).toBe(false)
    expect(isServiceCoveredByPlan(sobrancelha, planoBarba)).toBe(false)
    expect(isServiceCoveredByPlan(sobrancelha, planoCorteEBarba)).toBe(false)
  })
})

describe('calculateAppointmentPrice — cliente SEM plano', () => {
  it('paga tudo: corte + barba = preço cheio', () => {
    const { totalPrice, totalDuration, lines } = calculateAppointmentPrice(
      [corte, barba],
      null,
    )
    expect(totalPrice).toBe(100)
    expect(totalDuration).toBe(50)
    expect(lines.every(l => l.covered_by_plan === false)).toBe(true)
  })

  it('marca todas as linhas como NÃO cobertas', () => {
    const { lines } = calculateAppointmentPrice([corte, barba, sobrancelha], undefined)
    expect(lines).toHaveLength(3)
    lines.forEach(l => expect(l.covered_by_plan).toBe(false))
  })
})

describe('calculateAppointmentPrice — cliente COM plano Corte', () => {
  it('corte sai grátis, barba paga', () => {
    const { totalPrice, lines } = calculateAppointmentPrice([corte, barba], planoCorte)
    expect(totalPrice).toBe(40) // só barba
    expect(lines.find(l => l.service_id === 'svc-corte')?.covered_by_plan).toBe(true)
    expect(lines.find(l => l.service_id === 'svc-barba')?.covered_by_plan).toBe(false)
  })

  it('só corte: preço zero', () => {
    const { totalPrice, lines } = calculateAppointmentPrice([corte], planoCorte)
    expect(totalPrice).toBe(0)
    expect(lines[0].covered_by_plan).toBe(true)
  })

  it('serviço extra (sobrancelha) cobra mesmo com plano', () => {
    const { totalPrice } = calculateAppointmentPrice([corte, sobrancelha], planoCorte)
    expect(totalPrice).toBe(25) // só sobrancelha
  })
})

describe('calculateAppointmentPrice — cliente COM plano Corte+Barba', () => {
  it('corte e barba grátis, sobrancelha paga', () => {
    const { totalPrice, lines } = calculateAppointmentPrice(
      [corte, barba, sobrancelha],
      planoCorteEBarba,
    )
    expect(totalPrice).toBe(25) // só sobrancelha
    expect(lines.find(l => l.service_id === 'svc-corte')?.covered_by_plan).toBe(true)
    expect(lines.find(l => l.service_id === 'svc-barba')?.covered_by_plan).toBe(true)
    expect(lines.find(l => l.service_id === 'svc-sobr')?.covered_by_plan).toBe(false)
  })

  it('só corte + barba: preço zero', () => {
    const { totalPrice } = calculateAppointmentPrice([corte, barba], planoCorteEBarba)
    expect(totalPrice).toBe(0)
  })
})

describe('calculateAppointmentPrice — duração e linha mantêm preço cheio', () => {
  it('mesmo coberto, a linha mantém o preço cheio (útil pra histórico)', () => {
    const { lines } = calculateAppointmentPrice([corte], planoCorte)
    expect(lines[0].price).toBe(60) // preço cheio, mesmo coberto
    expect(lines[0].covered_by_plan).toBe(true)
  })

  it('duração total NÃO muda mesmo com cobertura', () => {
    const semPlano = calculateAppointmentPrice([corte, barba], null)
    const comPlano = calculateAppointmentPrice([corte, barba], planoCorteEBarba)
    expect(semPlano.totalDuration).toBe(comPlano.totalDuration)
    expect(semPlano.totalDuration).toBe(50)
  })

  it('lista vazia: total 0, duração 0', () => {
    const { totalPrice, totalDuration, lines } = calculateAppointmentPrice([], planoCorte)
    expect(totalPrice).toBe(0)
    expect(totalDuration).toBe(0)
    expect(lines).toEqual([])
  })
})
