// Funções puras pra aplicar eventos realtime no estado local.
// Isolar essa lógica permite testar sem montar o React + Supabase.

import type { Appointment, AppointmentStatus } from '@/types'

type AnyAppointment = Partial<Appointment> & {
  id: string
  scheduled_at: string
  barber_id: string
  status: AppointmentStatus
}

const HIDDEN_STATUSES: AppointmentStatus[] = ['cancelled', 'no_show']

function isOnDate(scheduledAt: string, date: string): boolean {
  // `date` é YYYY-MM-DD; pegamos só os 10 primeiros chars do scheduled_at
  return scheduledAt.slice(0, 10) === date
}

function sortByTime<T extends { scheduled_at: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )
}

/**
 * Aplica um INSERT do realtime no estado local.
 *
 * Regras:
 *  - Só inclui se o agendamento é do dia atual (filtro de data).
 *  - Só inclui se o status não é cancelado/no_show.
 *  - Não duplica se já existir (idempotente — protege contra eventos retransmitidos).
 *  - Mantém ordenação por horário.
 */
export function applyInsert<T extends AnyAppointment>(
  prev: T[],
  incoming: T,
  date: string,
): T[] {
  if (!isOnDate(incoming.scheduled_at, date)) return prev
  if (HIDDEN_STATUSES.includes(incoming.status)) return prev
  if (prev.some(a => a.id === incoming.id)) return prev
  return sortByTime([...prev, incoming])
}

/**
 * Aplica um UPDATE do realtime no estado local.
 *
 * Regras:
 *  - Se status virou cancelado/no_show, remove da lista (não confundir o barbeiro).
 *  - Se o agendamento foi reagendado pra outro dia, remove.
 *  - Se ainda não está na lista mas é do dia atual e visível, adiciona (caso o INSERT
 *    tenha sido perdido por race condition).
 *  - Caso contrário, atualiza in-place mantendo a ordem por horário.
 */
export function applyUpdate<T extends AnyAppointment>(
  prev: T[],
  incoming: T,
  date: string,
): T[] {
  const existing = prev.find(a => a.id === incoming.id)
  const shouldHide =
    HIDDEN_STATUSES.includes(incoming.status) || !isOnDate(incoming.scheduled_at, date)

  if (shouldHide) {
    return existing ? prev.filter(a => a.id !== incoming.id) : prev
  }

  if (!existing) {
    // Self-healing: UPDATE chegou mas nunca tivemos o INSERT — adicionamos
    return sortByTime([...prev, incoming])
  }

  return sortByTime(
    prev.map(a => (a.id === incoming.id ? ({ ...a, ...incoming } as T) : a)),
  )
}

/**
 * Aplica um DELETE do realtime no estado local.
 */
export function applyDelete<T extends AnyAppointment>(prev: T[], id: string): T[] {
  return prev.filter(a => a.id !== id)
}

/**
 * Mescla a lista vinda da busca inicial com o estado atual (que pode já ter
 * sido atualizado pelo realtime durante o tempo da busca).
 *
 * Resolve o race condition: se um INSERT chegou entre o disparo do select() e
 * o `.then()`, ele NÃO pode ser sobrescrito pela resposta da busca.
 *
 * Regras:
 *  - Itens que existem APENAS no estado atual (current) são preservados —
 *    foram inseridos via realtime e ainda não estão no fetch (replication lag).
 *  - Itens que existem em ambos: usa a versão do fetch (mais autoritativa).
 *  - Itens que existem APENAS no fetch são incluídos.
 *  - Filtra cancelados/no_show e dias errados.
 */
export function reconcileInitialFetch<T extends AnyAppointment>(
  fetched: T[],
  current: T[],
  date: string,
): T[] {
  const visible = (a: T) =>
    !HIDDEN_STATUSES.includes(a.status) && isOnDate(a.scheduled_at, date)

  const byId = new Map<string, T>()
  for (const a of fetched) if (visible(a)) byId.set(a.id, a)
  for (const a of current) if (visible(a) && !byId.has(a.id)) byId.set(a.id, a)

  return sortByTime([...byId.values()])
}
