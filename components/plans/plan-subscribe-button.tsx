'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlanCard } from './plan-card'
import { subscribeToPlan, cancelSubscription } from '@/actions/subscriptions'
import type { Plan } from '@/types'

interface PlanSubscribeButtonProps {
  plan: Plan
  isActive: boolean
  currentSubscriptionId?: string
}

export function PlanSubscribeButton({ plan, isActive, currentSubscriptionId }: PlanSubscribeButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubscribe = () => {
    setError('')
    startTransition(async () => {
      const result = await subscribeToPlan({ plan_id: plan.id })
      if (!result.success) { setError(result.error); return }
      router.refresh()
    })
  }

  const handleCancel = () => {
    if (!currentSubscriptionId) return
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return
    startTransition(async () => {
      await cancelSubscription(currentSubscriptionId, 'Cancelado pelo cliente')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <PlanCard
        plan={plan}
        isActive={isActive}
        onSubscribe={isPending ? undefined : handleSubscribe}
      />

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {isPending && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          Ativando assinatura...
        </p>
      )}

      {isActive && currentSubscriptionId && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full py-2 rounded-lg border border-red-800/40 text-red-400 text-xs hover:bg-red-950/20 transition-all disabled:opacity-50"
        >
          Cancelar assinatura
        </button>
      )}
    </div>
  )
}
