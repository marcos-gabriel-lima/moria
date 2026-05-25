// Lógica pura de precificação e cobertura por assinatura.
// Espelha a lógica de actions/appointments.ts pra ser testável isoladamente.

type ServiceLike = {
  id: string
  price: number
  covered_by_cut: boolean
  covered_by_beard: boolean
}

type PlanLike = {
  includes_cut: boolean
  includes_beard: boolean
}

type SubscriptionLike = {
  plan?: PlanLike | null
} | null | undefined

export type AppointmentServiceLine = {
  service_id: string
  price: number
  covered_by_plan: boolean
}

/**
 * Decide se um serviço é coberto pelo plano do cliente.
 *
 * Cobertura ocorre quando:
 *   - O serviço é de corte (covered_by_cut) E o plano inclui corte; OU
 *   - O serviço é de barba (covered_by_beard) E o plano inclui barba.
 *
 * Cliente sem plano nunca tem cobertura.
 */
export function isServiceCoveredByPlan(
  service: ServiceLike,
  subscription: SubscriptionLike,
): boolean {
  if (!subscription?.plan) return false
  return (
    (service.covered_by_cut && subscription.plan.includes_cut) ||
    (service.covered_by_beard && subscription.plan.includes_beard)
  )
}

/**
 * Dado um conjunto de serviços e uma assinatura (opcional), retorna:
 *  - linhas (cada serviço com preço cheio + flag de cobertura)
 *  - preço total real (soma dos preços dos serviços NÃO cobertos)
 *  - duração total
 */
export function calculateAppointmentPrice<
  S extends ServiceLike & { duration_minutes: number },
>(
  services: S[],
  subscription: SubscriptionLike,
): {
  lines: AppointmentServiceLine[]
  totalPrice: number
  totalDuration: number
} {
  let totalPrice = 0
  const lines: AppointmentServiceLine[] = services.map(service => {
    const covered = isServiceCoveredByPlan(service, subscription)
    if (!covered) totalPrice += service.price
    return {
      service_id: service.id,
      price: service.price,
      covered_by_plan: covered,
    }
  })
  const totalDuration = services.reduce((s, x) => s + x.duration_minutes, 0)
  return { lines, totalPrice, totalDuration }
}
