import { Suspense } from 'react'
import { Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { ActivateSubscriptionCard } from '@/components/admin/activate-subscription-card'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Assinaturas Pendentes' }
export const dynamic   = 'force-dynamic'

async function PendingList() {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('subscriptions')
    .select('id, created_at, plan:plans(id, name, price), client:profiles(id, full_name, phone, whatsapp)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (!pending?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-moria-border bg-moria-surface text-center gap-3">
        <Crown className="w-10 h-10 text-gold-DEFAULT/40" />
        <p className="text-muted-foreground">Nenhuma assinatura aguardando ativação</p>
        <p className="text-xs text-muted-foreground/60">Novos pedidos aparecem aqui quando um cliente assina um plano</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pending.map(sub => {
        const client = sub.client as any
        const plan   = sub.plan   as any
        return (
          <ActivateSubscriptionCard
            key={sub.id}
            subscriptionId={sub.id}
            clientName={client?.full_name ?? '—'}
            clientPhone={client?.whatsapp ?? client?.phone ?? null}
            planName={plan?.name ?? '—'}
            planPrice={plan?.price ?? 0}
            requestedAt={formatDate(sub.created_at)}
          />
        )
      })}
    </div>
  )
}

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas Pendentes"
        description="Ative manualmente após confirmar o pagamento do cliente"
        icon={Crown}
      />

      <Suspense fallback={
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-moria-surface border border-moria-border animate-pulse" />
          ))}
        </div>
      }>
        <PendingList />
      </Suspense>
    </div>
  )
}
