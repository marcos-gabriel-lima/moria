'use client'

import { Check, Crown, Scissors, Zap } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
  isActive?: boolean
  onSubscribe?: (plan: Plan) => void
  className?: string
}

export function PlanCard({ plan, isActive, onSubscribe, className }: PlanCardProps) {
  const isFeatured = plan.slug === 'corte-barba-ilimitado'

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-6 transition-all duration-300',
        isFeatured
          ? 'border-gold-DEFAULT bg-gradient-to-b from-gold-DEFAULT/10 to-moria-surface shadow-[0_0_40px_rgba(201,168,76,0.15)]'
          : 'border-moria-border bg-moria-surface hover:border-gold-DEFAULT/40',
        isActive && 'ring-2 ring-gold-DEFAULT ring-offset-2 ring-offset-background',
        className
      )}
    >
      {isFeatured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 bg-gold-gradient px-3 py-1 rounded-full text-xs font-bold text-black">
            <Crown className="w-3 h-3" />
            MAIS POPULAR
          </span>
        </div>
      )}

      {isActive && (
        <div className="absolute -top-3.5 right-4">
          <span className="flex items-center gap-1 bg-green-900 border border-green-700 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
            <Check className="w-3 h-3" />
            SEU PLANO
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {plan.includes_cut && plan.includes_beard ? (
            <Crown className="w-5 h-5 text-gold-DEFAULT" />
          ) : plan.includes_cut ? (
            <Scissors className="w-5 h-5 text-gold-DEFAULT" />
          ) : (
            <Zap className="w-5 h-5 text-gold-DEFAULT" />
          )}
          <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Preço */}
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-foreground">
            {formatCurrency(plan.price).replace('R$\xa0', 'R$ ')}
          </span>
          <span className="text-muted-foreground mb-1.5">/mês</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Cancele quando quiser, sem multa
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 text-gold-DEFAULT shrink-0 mt-0.5" />
            <span className="text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {!isActive && onSubscribe && (
        <button
          onClick={() => onSubscribe(plan)}
          className={cn(
            'w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200',
            isFeatured
              ? 'bg-gold-gradient text-black hover:opacity-90 hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]'
              : 'bg-moria-elevated border border-moria-border text-foreground hover:border-gold-DEFAULT/60 hover:bg-gold-DEFAULT/5'
          )}
        >
          Assinar {plan.name}
        </button>
      )}

      {isActive && (
        <div className="w-full py-3 rounded-lg text-center text-sm font-semibold text-gold-DEFAULT bg-gold-DEFAULT/10 border border-gold-DEFAULT/30">
          Plano Ativo
        </div>
      )}
    </div>
  )
}
