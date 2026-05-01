'use client'

import { useState, useTransition } from 'react'
import { PlanCard } from './plan-card'
import { subscribeToPlan, cancelSubscription } from '@/actions/subscriptions'
import type { Plan } from '@/types'

interface PlanSubscribeButtonProps {
  plan: Plan
  isActive: boolean
  currentSubscriptionId?: string
}

export function PlanSubscribeButton({ plan, isActive, currentSubscriptionId }: PlanSubscribeButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix')

  const handleSubscribe = () => setShowModal(true)

  const handleConfirm = () => {
    setError('')
    startTransition(async () => {
      const result = await subscribeToPlan({ plan_id: plan.id, payment_method: paymentMethod })
      if (!result.success) { setError(result.error); return }
      setShowModal(false)
      window.location.reload()
    })
  }

  const handleCancel = () => {
    if (!currentSubscriptionId) return
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return
    startTransition(async () => {
      await cancelSubscription(currentSubscriptionId, 'Cancelado pelo cliente')
      window.location.reload()
    })
  }

  return (
    <>
      <PlanCard
        plan={plan}
        isActive={isActive}
        onSubscribe={handleSubscribe}
      />

      {/* Modal de pagamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-moria-surface border border-moria-border p-6 space-y-5">
            <h3 className="font-bold text-lg">Assinar {plan.name}</h3>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Forma de pagamento</p>
              <div className="grid grid-cols-2 gap-3">
                {(['pix', 'credit_card'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                      paymentMethod === method
                        ? 'border-gold-DEFAULT bg-gold-DEFAULT/10 text-gold-DEFAULT'
                        : 'border-moria-border text-muted-foreground hover:border-moria-border/80'
                    }`}
                  >
                    {method === 'pix' ? '⚡ Pix' : '💳 Cartão'}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-moria-border text-sm hover:bg-moria-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {isPending ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
