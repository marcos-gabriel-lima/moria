'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Crown, Calendar, Scissors, CheckCircle2, XCircle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Subscription } from '@/types'
import QRCode from 'qrcode'

interface SubscriptionWalletProps {
  subscription: Subscription
  onCancel?: () => void
}

export function SubscriptionWallet({ subscription, onCancel }: SubscriptionWalletProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const plan = subscription.plan!
  const isActive = subscription.status === 'active'
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  useEffect(() => {
    if (subscription.qr_code_token) {
      QRCode.toDataURL(subscription.qr_code_token, {
        width: 200,
        margin: 2,
        color: { dark: '#C9A84C', light: '#111111' },
      }).then(setQrDataUrl)
    }
  }, [subscription.qr_code_token])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6',
        isActive
          ? 'border-gold-DEFAULT/50 bg-gradient-to-br from-moria-surface to-black shadow-[0_0_40px_rgba(201,168,76,0.12)]'
          : 'border-moria-border bg-moria-surface opacity-70'
      )}
    >
      {/* Fundo decorativo */}
      {isActive && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold-DEFAULT blur-3xl" />
        </div>
      )}

      <div className="relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-gold-DEFAULT" />
              <span className="text-xs text-gold-DEFAULT font-semibold uppercase tracking-wider">
                Carteira Digital
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
          </div>

          <span
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
              isActive
                ? 'bg-green-950/50 border-green-800/50 text-green-400'
                : 'bg-red-950/50 border-red-800/50 text-red-400'
            )}
          >
            {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Benefícios */}
        <div className="flex gap-3">
          {plan.includes_cut && (
            <div className="flex items-center gap-1.5 text-sm bg-moria-elevated rounded-lg px-3 py-2 border border-moria-border">
              <Scissors className="w-3.5 h-3.5 text-gold-DEFAULT" />
              <span>Corte Ilimitado</span>
            </div>
          )}
          {plan.includes_beard && (
            <div className="flex items-center gap-1.5 text-sm bg-moria-elevated rounded-lg px-3 py-2 border border-moria-border">
              <Scissors className="w-3.5 h-3.5 text-gold-DEFAULT rotate-90" />
              <span>Barba Ilimitada</span>
            </div>
          )}
        </div>

        {/* QR Code + Validade */}
        <div className="flex items-center justify-between gap-4">
          {/* Info de validade */}
          <div className="space-y-3">
            {expiresAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Válido até</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-gold-DEFAULT" />
                  {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            )}

            {isActive && daysLeft > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Dias restantes</p>
                <div
                  className={cn(
                    'text-2xl font-black',
                    daysLeft <= 5 ? 'text-red-400' : 'text-gold-DEFAULT'
                  )}
                >
                  {daysLeft}
                  <span className="text-sm font-normal text-muted-foreground ml-1">dias</span>
                </div>
              </div>
            )}

            {isActive && (
              <button
                onClick={onCancel}
                className="text-xs text-muted-foreground hover:text-red-400 transition-colors underline underline-offset-2"
              >
                Cancelar assinatura
              </button>
            )}
          </div>

          {/* QR Code */}
          {qrDataUrl && isActive && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 bg-moria-elevated rounded-lg border border-gold-DEFAULT/20">
                <img
                  src={qrDataUrl}
                  alt="QR Code da assinatura"
                  className="w-24 h-24 rounded"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Mostre ao barbeiro
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
