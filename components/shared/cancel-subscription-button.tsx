'use client'

import { useState, useTransition } from 'react'
import { XCircle } from 'lucide-react'
import { cancelSubscription } from '@/actions/subscriptions'

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = () => {
    setError('')
    startTransition(async () => {
      const result = await cancelSubscription(subscriptionId, 'Cancelado pelo cliente')
      if (!result.success) { setError(result.error); return }
      window.location.reload()
    })
  }

  return (
    <div className="space-y-2">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-800/40 text-red-400 text-sm hover:bg-red-950/20 transition-all"
        >
          <XCircle className="w-4 h-4" />
          Cancelar assinatura
        </button>
      ) : (
        <div className="rounded-lg border border-red-800/40 bg-red-950/20 p-4 space-y-3">
          <p className="text-sm font-medium text-red-400">Confirmar cancelamento?</p>
          <p className="text-xs text-muted-foreground">
            Sua assinatura ficará ativa até o fim do período pago. Sem multa.
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 rounded-lg border border-moria-border text-sm"
            >
              Manter plano
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg bg-red-900 text-red-100 text-sm font-medium hover:bg-red-800 disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Cancelando...' : 'Sim, cancelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
