import { describe, it, expect } from 'vitest'
import {
  sumRevenue,
  monthOverMonthDiff,
  monthShare,
  completionRate,
  completionRateAccent,
  totalAppointments,
  monthlyRecurringRevenue,
  rankBarbers,
  barberCompletionRate,
  calculateCommission,
} from '@/lib/reports'

describe('sumRevenue', () => {
  it('soma a receita de múltiplos meses', () => {
    const r = sumRevenue([
      { label: 'Jan', value: 1000 },
      { label: 'Fev', value: 1500 },
      { label: 'Mar', value: 2000 },
    ])
    expect(r).toBe(4500)
  })

  it('retorna 0 quando não há meses', () => {
    expect(sumRevenue([])).toBe(0)
  })

  it('lida com valores zerados', () => {
    expect(sumRevenue([{ label: 'Jan', value: 0 }])).toBe(0)
  })
})

describe('monthOverMonthDiff', () => {
  it('retorna diff e percentual positivo quando há crescimento', () => {
    const { diff, pctLabel } = monthOverMonthDiff(1200, 1000)
    expect(diff).toBe(200)
    expect(pctLabel).toBe('20.0%')
  })

  it('retorna diff negativo quando houve queda', () => {
    const { diff, pctLabel } = monthOverMonthDiff(800, 1000)
    expect(diff).toBe(-200)
    expect(pctLabel).toBe('-20.0%')
  })

  it('retorna null quando não há mês anterior', () => {
    const { diff, pctLabel } = monthOverMonthDiff(1000, null)
    expect(diff).toBe(null)
    expect(pctLabel).toBe(null)
  })

  it('retorna diff sem percentual quando previous é zero (evita div by zero)', () => {
    const { diff, pctLabel } = monthOverMonthDiff(500, 0)
    expect(diff).toBe(500)
    expect(pctLabel).toBe(null)
  })
})

describe('monthShare', () => {
  it('calcula percentual com 1 casa decimal', () => {
    expect(monthShare(250, 1000)).toBe('25.0')
  })

  it('retorna "0" quando total é zero', () => {
    expect(monthShare(100, 0)).toBe('0')
  })

  it('retorna "0" quando total é negativo (defensivo)', () => {
    expect(monthShare(100, -50)).toBe('0')
  })
})

describe('completionRate', () => {
  it('calcula taxa quando há cancelamentos e no_show', () => {
    const rate = completionRate({ completed: 80, cancelled: 15, no_show: 5 })
    expect(rate).toBe(80)
  })

  it('retorna 100 quando todos foram concluídos', () => {
    expect(completionRate({ completed: 10 })).toBe(100)
  })

  it('retorna 0 quando não há nenhum agendamento finalizado', () => {
    expect(completionRate({ scheduled: 5 })).toBe(0)
  })

  it('ignora agendamentos ainda em andamento ou agendados', () => {
    const rate = completionRate({
      completed: 50,
      cancelled: 50,
      scheduled: 100, // não conta no denominador
      in_progress: 100, // não conta no denominador
    })
    expect(rate).toBe(50)
  })
})

describe('completionRateAccent', () => {
  it('verde para 80% ou mais', () => {
    expect(completionRateAccent(80)).toBe('green')
    expect(completionRateAccent(95)).toBe('green')
  })

  it('azul entre 60-79%', () => {
    expect(completionRateAccent(60)).toBe('blue')
    expect(completionRateAccent(79)).toBe('blue')
  })

  it('vermelho abaixo de 60%', () => {
    expect(completionRateAccent(59)).toBe('red')
    expect(completionRateAccent(0)).toBe('red')
  })
})

describe('totalAppointments', () => {
  it('soma todos os status', () => {
    const total = totalAppointments({
      completed: 30,
      cancelled: 5,
      scheduled: 10,
      no_show: 2,
    })
    expect(total).toBe(47)
  })

  it('retorna 0 quando não há agendamentos', () => {
    expect(totalAppointments({})).toBe(0)
  })
})

describe('monthlyRecurringRevenue (MRR)', () => {
  it('soma price × count de cada plano', () => {
    const mrr = monthlyRecurringRevenue([
      { name: 'Corte Ilimitado', count: 10, price: 150 },
      { name: 'Barba Ilimitada', count: 5,  price: 89  },
      { name: 'Corte + Barba',   count: 8,  price: 199 },
    ])
    expect(mrr).toBe(10 * 150 + 5 * 89 + 8 * 199)
    expect(mrr).toBe(3537)
  })

  it('retorna 0 quando não há assinantes', () => {
    expect(monthlyRecurringRevenue([])).toBe(0)
  })

  it('ignora plano sem assinantes', () => {
    const mrr = monthlyRecurringRevenue([
      { name: 'Plano X', count: 0, price: 999 },
    ])
    expect(mrr).toBe(0)
  })
})

describe('rankBarbers', () => {
  const A = { name: 'Alice',  completed: 10, total: 12, revenue: 1500 }
  const B = { name: 'Bob',    completed: 20, total: 20, revenue: 3000 }
  const C = { name: 'Carlos', completed: 15, total: 18, revenue: 1500 }

  it('ordena por receita decrescente', () => {
    const ranked = rankBarbers([A, B, C])
    expect(ranked[0].name).toBe('Bob')
  })

  it('desempate por taxa de conclusão (Alice 83% vs Carlos 83%)', () => {
    // Alice = 10/12 ≈ 83.3%, Carlos = 15/18 ≈ 83.3% — empate verdadeiro: mantém ordem
    const ranked = rankBarbers([A, B, C])
    expect(ranked[1].revenue).toBe(1500)
    expect(ranked[2].revenue).toBe(1500)
  })

  it('desempate real: maior taxa de conclusão fica na frente', () => {
    const X = { name: 'X', completed: 5,  total: 10, revenue: 1000 } // 50%
    const Y = { name: 'Y', completed: 9,  total: 10, revenue: 1000 } // 90%
    const ranked = rankBarbers([X, Y])
    expect(ranked[0].name).toBe('Y')
  })

  it('não muta o array original', () => {
    const input = [A, B, C]
    rankBarbers(input)
    expect(input).toEqual([A, B, C])
  })

  it('lida com array vazio', () => {
    expect(rankBarbers([])).toEqual([])
  })
})

describe('barberCompletionRate', () => {
  it('calcula porcentagem inteira', () => {
    expect(barberCompletionRate({ completed: 8, total: 10 })).toBe(80)
  })

  it('retorna 0 quando barbeiro não teve agendamentos', () => {
    expect(barberCompletionRate({ completed: 0, total: 0 })).toBe(0)
  })

  it('100% quando todos foram concluídos', () => {
    expect(barberCompletionRate({ completed: 5, total: 5 })).toBe(100)
  })
})

describe('calculateCommission — REGRESSÃO BUG 100x', () => {
  // CONTRATO: commission_rate vem do BD como percentual (0-100), não decimal.
  // Coluna: barbers.commission_rate numeric(5,2) default 50.00

  it('50% de R$ 10.000 = R$ 5.000', () => {
    expect(calculateCommission(10000, 50)).toBe(5000)
  })

  it('40% de R$ 8.000 = R$ 3.200', () => {
    expect(calculateCommission(8000, 40)).toBe(3200)
  })

  it('default da migration (50%) com receita zero = 0', () => {
    expect(calculateCommission(0, 50)).toBe(0)
  })

  it('100% de receita = receita inteira (caso limite)', () => {
    expect(calculateCommission(2500, 100)).toBe(2500)
  })

  it('0% de receita = 0', () => {
    expect(calculateCommission(5000, 0)).toBe(0)
  })

  it('barbeiro premium 60% de R$ 12.500 = R$ 7.500', () => {
    expect(calculateCommission(12500, 60)).toBe(7500)
  })

  it('garante que NÃO trata commission_rate como decimal (bug antigo)', () => {
    // Antes: revenue * 0.5 = 5000 (errado, se rate é 0.5 trata como 0.5%)
    // Bug invertido: revenue * 50 = 500.000 (errado, 100x maior)
    // Correto: revenue * (50/100) = 5000
    const result = calculateCommission(10000, 50)
    expect(result).not.toBe(500000) // não pode multiplicar direto
    expect(result).not.toBe(50)     // não pode dividir por 100 errado
    expect(result).toBe(5000)
  })
})
