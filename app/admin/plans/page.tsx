import { Suspense } from 'react'
import { Crown, Scissors } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { PlanManageCard } from '@/components/admin/plan-manage-card'
import { ServiceManageTable } from '@/components/admin/service-manage-table'
import { CreatePlanButton } from '@/components/admin/create-plan-button'
import { CreateServiceButton } from '@/components/admin/create-service-button'
import { getAdminPlans } from '@/lib/queries'

export const metadata = { title: 'Planos & Serviços' }

function PlansSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="space-y-5">
        <div className="h-8 w-48 bg-moria-elevated rounded-lg" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-moria-border bg-moria-surface h-48" />
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <div className="h-8 w-48 bg-moria-elevated rounded-lg" />
        <div className="rounded-xl border border-moria-border bg-moria-surface h-64" />
      </div>
    </div>
  )
}

async function PlansContent() {
  const { plans, services, subCountByPlan } = await getAdminPlans()

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <PageHeader
          title="Planos de Assinatura"
          description="Gerencie os planos disponíveis para os clientes"
          icon={Crown}
          actions={<CreatePlanButton />}
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan: any) => (
            <PlanManageCard
              key={plan.id}
              plan={plan}
              activeSubscribers={subCountByPlan[plan.id] ?? 0}
            />
          ))}
          {!plans.length && (
            <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">
              Nenhum plano cadastrado
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <PageHeader
          title="Catálogo de Serviços"
          description="Serviços oferecidos e seus preços"
          icon={Scissors}
          actions={<CreateServiceButton />}
        />
        <ServiceManageTable services={services as any[]} />
      </div>
    </div>
  )
}

export default function AdminPlansPage() {
  return (
    <Suspense fallback={<PlansSkeleton />}>
      <PlansContent />
    </Suspense>
  )
}
