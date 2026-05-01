import { DEMO_SUBSCRIPTION } from '@/lib/demo-data'
import { SubscriptionWallet } from '@/components/shared/subscription-wallet'
import type { Subscription } from '@/types'

export const metadata = { title: 'Demo — Carteira' }

export default function DemoWalletPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-black">Carteira Digital</h1>
      <SubscriptionWallet
        subscription={DEMO_SUBSCRIPTION as unknown as Subscription}
      />
      <div className="p-4 rounded-xl bg-moria-surface border border-moria-border text-sm text-muted-foreground text-center">
        O QR Code é lido pelo barbeiro para confirmar o plano na hora do atendimento.
      </div>
    </div>
  )
}
