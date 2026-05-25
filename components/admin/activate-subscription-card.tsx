'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, MessageCircle, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { activateSubscription, cancelClientSubscription } from '@/actions/admin'
import { cn, formatCurrency, getWhatsAppUrl } from '@/lib/utils'
import type { BillingPeriod } from '@/lib/billing'
import type { PaymentMethod } from '@/types'

const PERIOD_OPTIONS: { label: string; period: BillingPeriod }[] = [
  { label: '1 mês',   period: { unit: 'months', value: 1 } },
  { label: '3 meses', period: { unit: 'months', value: 3 } },
  { label: '6 meses', period: { unit: 'months', value: 6 } },
  { label: '1 ano',   period: { unit: 'years',  value: 1 } },
]

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix:         'PIX',
  credit_card: 'Cartão de crédito',
  debit_card:  'Cartão de débito',
  cash:        'Dinheiro',
  plan:        'Plano',
}

interface Props {
  subscriptionId: string
  clientName:     string
  clientPhone:    string | null
  planName:       string
  planPrice:      number
  requestedAt:    string
}

export function ActivateSubscriptionCard({ subscriptionId, clientName, clientPhone, planName, planPrice, requestedAt }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [periodIdx,     setPeriodIdx]     = useState(0)
  const [error, setError]  = useState('')
  const [done,  setDone]   = useState(false)

  function handleActivate() {
    setError('')
    start(async () => {
      const res = await activateSubscription(subscriptionId, paymentMethod, PERIOD_OPTIONS[periodIdx].period)
      if (!res.success) { setError(res.error ?? 'Erro ao ativar'); return }
      setDone(true)
      router.refresh()
    })
  }

  function handleCancel() {
    setError('')
    start(async () => {
      const res = await cancelClientSubscription(subscriptionId, 'Cancelado pelo admin antes da ativação')
      if (!res.success) { setError(res.error ?? 'Erro'); return }
      setDone(true)
      router.refresh()
    })
  }

  if (done) return null

  return (
    <div className={cn(
      'rounded-xl border border-moria-border bg-moria-surface p-5 transition-opacity',
      isPending && 'opacity-60 pointer-events-none'
    )}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/30 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-gold-DEFAULT" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{clientName}</p>
            <p className="text-xs text-muted-foreground">{planName} · {formatCurrency(planPrice)}/mês</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Pedido em {requestedAt}</p>
          </div>
        </div>

        {/* WhatsApp */}
        {clientPhone && (
          <a
            href={getWhatsAppUrl(clientPhone, `Olá ${clientName}! Confirmamos o pagamento do seu plano *${planName}*. Vou ativar sua assinatura agora.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-950/40 border border-green-900/40 text-green-400 text-xs font-medium hover:bg-green-950/60 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        )}
      </div>

      {/* Configuração de ativação */}
      <div className="mt-4 pt-4 border-t border-moria-border flex flex-wrap items-end gap-3">
        {/* Forma de pagamento */}
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">Forma de pagamento</label>
          <div className="relative">
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-moria-elevated border border-moria-border rounded-lg px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:border-gold-DEFAULT/50"
            >
              {Object.entries(PAYMENT_LABELS).filter(([k]) => k !== 'plan').map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Duração */}
        <div className="w-32">
          <label className="text-xs text-muted-foreground mb-1.5 block">Duração</label>
          <select
            value={periodIdx}
            onChange={e => setPeriodIdx(Number(e.target.value))}
            className="w-full bg-moria-elevated border border-moria-border rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:border-gold-DEFAULT/50"
          >
            {PERIOD_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-moria-border text-muted-foreground hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 text-sm transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Recusar
          </button>
          <button
            onClick={handleActivate}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-DEFAULT text-moria-black font-semibold text-sm hover:bg-gold-light transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Ativar assinatura
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  )
}
