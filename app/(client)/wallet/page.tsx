import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Crown, ChevronRight } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { SubscriptionWallet } from '@/components/shared/subscription-wallet'
import { CancelSubscriptionButton } from '@/components/shared/cancel-subscription-button'
import type { Subscription } from '@/types'

export const metadata = { title: 'Carteira' }

export default async function WalletPage() {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!subscription) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-black">Carteira Digital</h1>

        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-moria-surface border border-moria-border flex items-center justify-center">
            <Crown className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Nenhuma assinatura</p>
            <p className="text-sm text-muted-foreground">
              Assine um plano e tenha sua carteira digital
            </p>
          </div>
          <Link
            href="/plans"
            className="flex items-center gap-2 bg-gold-gradient text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Ver Planos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-black">Carteira Digital</h1>

      <SubscriptionWallet
        subscription={subscription as unknown as Subscription}
      />

      {subscription.status === 'active' && (
        <CancelSubscriptionButton subscriptionId={subscription.id} />
      )}
    </div>
  )
}
