// Helpers de timezone fixados em horário do Brasil (BRT).
//
// Por que offset fixo em vez de Intl.DateTimeFormat:
//   - Brasil aboliu o horário de verão em 2019 (Decreto 9.772/2019).
//     Desde então, BR = UTC-3 o ano inteiro, sem mudança em outubro/fevereiro.
//   - Offset fixo é puro, determinístico e testável sem mock de Intl.
//   - Se o Brasil voltar a ter DST, este arquivo precisa virar Intl-based.

const BR_OFFSET_HOURS = -3

/**
 * Converte uma Date (interpretada como UTC) pra um "Date-em-UTC que carrega
 * os campos year/month/day/hour... do horário BR daquele instante".
 *
 * Use os getters `getUTC*` no resultado pra ler os campos como se fosse BR.
 */
function asBrFields(utc: Date): Date {
  return new Date(utc.getTime() + BR_OFFSET_HOURS * 60 * 60 * 1000)
}

/**
 * Início do mês atual em BR, retornado como ISO UTC.
 *
 * @example
 *   // Se now = 2026-05-15T15:00:00Z (= 2026-05-15 12:00 BR)
 *   startOfMonthBR(now) // → "2026-05-01T03:00:00.000Z" (= 2026-05-01 00:00 BR)
 */
export function startOfMonthBR(now: Date): string {
  const br = asBrFields(now)
  return new Date(Date.UTC(
    br.getUTCFullYear(),
    br.getUTCMonth(),
    1,
    -BR_OFFSET_HOURS, 0, 0,
  )).toISOString()
}

/**
 * Fim do mês atual em BR (último ms do mês), retornado como ISO UTC.
 *
 * @example
 *   // Se now está em maio/2026
 *   endOfMonthBR(now) // → "2026-06-01T02:59:59.999Z" (= 2026-05-31 23:59:59.999 BR)
 */
export function endOfMonthBR(now: Date): string {
  const br = asBrFields(now)
  return new Date(Date.UTC(
    br.getUTCFullYear(),
    br.getUTCMonth() + 1,
    1,
    -BR_OFFSET_HOURS, 0, 0,
  ) - 1).toISOString()
}

/**
 * Início e fim de um mês BR a partir de (ano, mês). `month` é 1-12 (não 0-11).
 *
 * Útil pra filtros de histórico onde o usuário escolheu um mês específico
 * num dropdown — em vez de calcular "N meses atrás" da data atual.
 */
export function monthRangeBRFromYearMonth(year: number, month: number): { start: string; end: string } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, -BR_OFFSET_HOURS, 0, 0)).toISOString(),
    end:   new Date(Date.UTC(year, month,     1, -BR_OFFSET_HOURS, 0, 0) - 1).toISOString(),
  }
}

/**
 * Início e fim do mês N meses atrás em BR.
 */
export function monthRangeBR(now: Date, monthsAgo = 0): { start: string; end: string } {
  const br = asBrFields(now)
  const year  = br.getUTCFullYear()
  const month = br.getUTCMonth() - monthsAgo
  return {
    start: new Date(Date.UTC(year, month,     1, -BR_OFFSET_HOURS, 0, 0)).toISOString(),
    end:   new Date(Date.UTC(year, month + 1, 1, -BR_OFFSET_HOURS, 0, 0) - 1).toISOString(),
  }
}

/**
 * Início e fim de um dia em BR (com offset opcional em dias).
 *
 * Ex.: `dayRangeBR(now, 1)` → range do "amanhã BR" como ISO UTC.
 *      `dayRangeBR(now, 0)` → range do "hoje BR".
 *      `dayRangeBR(now, -1)` → range do "ontem BR".
 */
export function dayRangeBR(now: Date, daysOffset = 0): { start: string; end: string } {
  const br = asBrFields(now)
  const year  = br.getUTCFullYear()
  const month = br.getUTCMonth()
  const day   = br.getUTCDate() + daysOffset
  return {
    start: new Date(Date.UTC(year, month, day,     -BR_OFFSET_HOURS, 0, 0)).toISOString(),
    end:   new Date(Date.UTC(year, month, day + 1, -BR_OFFSET_HOURS, 0, 0) - 1).toISOString(),
  }
}

/**
 * Início do dia atual em BR, retornado como ISO UTC.
 */
export function startOfDayBR(now: Date): string {
  const br = asBrFields(now)
  return new Date(Date.UTC(
    br.getUTCFullYear(),
    br.getUTCMonth(),
    br.getUTCDate(),
    -BR_OFFSET_HOURS, 0, 0,
  )).toISOString()
}

/**
 * Fim do dia atual em BR, retornado como ISO UTC.
 */
export function endOfDayBR(now: Date): string {
  const br = asBrFields(now)
  return new Date(Date.UTC(
    br.getUTCFullYear(),
    br.getUTCMonth(),
    br.getUTCDate() + 1,
    -BR_OFFSET_HOURS, 0, 0,
  ) - 1).toISOString()
}

/**
 * Data atual em BR no formato "YYYY-MM-DD" (sem timezone).
 *
 * Cuidado: o mesmo `now` (UTC) em momentos diferentes do dia BR
 * pode retornar dias diferentes (ex: 26/05 01h UTC = 25/05 BR).
 */
export function todayBR(now: Date): string {
  const br = asBrFields(now)
  return `${br.getUTCFullYear()}-${String(br.getUTCMonth() + 1).padStart(2, '0')}-${String(br.getUTCDate()).padStart(2, '0')}`
}
