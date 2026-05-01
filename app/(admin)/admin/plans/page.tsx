import { redirect } from 'next/navigation'
import { Crown, Scissors } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { PlanManageCard } from '@/components/admin/plan-manage-card'
import { ServiceManageTable } from '@/components/admin/service-manage-table'
import { CreatePlanButton } from '@/components/admin/create-plan-button'
import { CreateServiceButton } from '@/components/admin/create-service-button'

export const metadata = { title: 'Planos & Serviços' }

export default async function AdminPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: plans }, { data: services }] = await Promise.all([
    supabase.from('plans').select('*').order('display_order'),
    supabase.from('services').select('*').order('display_order'),
  ])

  // Quantos assinantes ativos por plano
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())

  const subCountByPlan: Record<string, number> = {}
  activeSubs?.forEach(s => {
    subCountByPlan[s.plan_id] = (subCountByPlan[s.plan_id] ?? 0) + 1
  })

  return (
    <div className="space-y-10">
      {/* Planos */}
      <div className="space-y-5">
        <PageHeader
          title="Planos de Assinatura"
          description="Gerencie os planos disponíveis para os clientes"
          icon={Crown}
          actions={<CreatePlanButton />}
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans?.map(plan => (
            <PlanManageCard
              key={plan.id}
              plan={plan as any}
              activeSubscribers={subCountByPlan[plan.id] ?? 0}
            />
          ))}
          {!plans?.length && (
            <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">
              Nenhum plano cadastrado
            </div>
          )}
        </div>
      </div>

      {/* Serviços */}
      <div className="space-y-5">
        <PageHeader
          title="Catálogo de Serviços"
          description="Serviços oferecidos e seus preços"
          icon={Scissors}
          actions={<CreateServiceButton />}
        />
        <ServiceManageTable services={(services ?? []) as any[]} />
      </div>
    </div>
  )
}
