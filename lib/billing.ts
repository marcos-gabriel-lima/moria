// Lógica pura de duração de assinatura.
//
// Decisões de design:
//   - Usa date-fns (`addMonths`/`addDays`/`addYears`) em vez de aritmética
//     de milissegundos. Motivo: meses têm 28/29/30/31 dias; `addMonths` ajusta
//     pro fim do mês quando o dia não existe (ex: 31/jan + 1 mês = 28/fev).
//   - A unidade canônica de cobrança é o MÊS (não 30 dias), alinhada com a
//     percepção do cliente ("plano mensal") e com a precificação (R$ X/mês).

import { addDays, addMonths, addYears } from 'date-fns'

export type BillingUnit = 'days' | 'months' | 'years'

export interface BillingPeriod {
  unit:  BillingUnit
  value: number
}

const ADDERS: Record<BillingUnit, (date: Date, amount: number) => Date> = {
  days:   addDays,
  months: addMonths,
  years:  addYears,
}

/**
 * Calcula a data de expiração de uma assinatura.
 *
 * Exemplos (com `from = 2026-01-31`):
 *   calculateExpiry(from, { unit: 'months', value: 1 })  // 2026-02-28 (ajusta fim de mês)
 *   calculateExpiry(from, { unit: 'days',   value: 30 }) // 2026-03-02
 *   calculateExpiry(from, { unit: 'years',  value: 1 })  // 2027-01-31
 */
export function calculateExpiry(from: Date, period: BillingPeriod): Date {
  if (!Number.isInteger(period.value) || period.value <= 0) {
    throw new Error(`Período inválido: value=${period.value}`)
  }
  return ADDERS[period.unit](from, period.value)
}

/** Valida que um `BillingPeriod` recebido do client tem formato esperado. */
export function isValidBillingPeriod(input: unknown): input is BillingPeriod {
  if (typeof input !== 'object' || input === null) return false
  const p = input as Partial<BillingPeriod>
  if (p.unit !== 'days' && p.unit !== 'months' && p.unit !== 'years') return false
  if (typeof p.value !== 'number' || !Number.isInteger(p.value)) return false
  if (p.value <= 0 || p.value > 365) return false
  return true
}

/** Helpers de conveniência pra valores comuns. */
export const ONE_MONTH:    BillingPeriod = { unit: 'months', value: 1  }
export const THREE_MONTHS: BillingPeriod = { unit: 'months', value: 3  }
export const SIX_MONTHS:   BillingPeriod = { unit: 'months', value: 6  }
export const ONE_YEAR:     BillingPeriod = { unit: 'years',  value: 1  }
