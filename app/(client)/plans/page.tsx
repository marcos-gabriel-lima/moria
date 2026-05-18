import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { getPlansCache } from '@/lib/queries'
import { PlanCard } from '@/components/plans/plan-card'
import { PlanSubscribeButton } from '@/components/plans/plan-subscribe-button'
import { Shield, Clock, Crown } from 'lucide-react'

export const metadata = { title: 'Planos' }

export default async function PlansPage() {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const [plans, { data: activeSubscription }] = await Promise.all([
    getPlansCache(),
    supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-gold-DEFAULT" />
          <span className="text-sm text-gold-DEFAULT font-semibold uppercase tracking-wider">Assinaturas</span>
        </div>
        <h1 className="text-3xl font-black">Escolha seu Plano</h1>
        <p className="text-muted-foreground">
          Todos os planos incluem prioridade de agendamento e cancelamento sem multa
        </p>
      </div>

      {/* Benefícios gerais */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Crown, label: 'Prioridade total no agendamento' },
          { icon: Clock, label: 'Agende com qualquer antecedência' },
          { icon: Shield, label: 'Cancele quando quiser, sem multa' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-moria-surface border border-moria-border text-center">
            <Icon className="w-4 h-4 text-gold-DEFAULT" />
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Cards de planos */}
      <div className="grid sm:grid-cols-3 gap-6">
        {plans.map(plan => (
          <PlanSubscribeButton
            key={plan.id}
            plan={plan as any}
            isActive={activeSubscription?.plan_id === plan.id}
            currentSubscriptionId={activeSubscription?.id}
          />
        ))}
      </div>

      {/* Nota sobre regra 48h */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-moria-surface border border-moria-border text-sm text-muted-foreground">
        <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p>
          <strong className="text-foreground">Prioridade de agendamento:</strong>{' '}
          Assinantes podem agendar com qualquer antecedência.
          Não-assinantes só podem agendar com até <strong>48 horas</strong> de antecedência.
        </p>
      </div>
    </div>
  )
}
