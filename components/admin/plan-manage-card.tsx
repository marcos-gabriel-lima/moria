'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Users, Edit2, Check, X, Plus, Minus } from 'lucide-react'
import { togglePlanActive, updatePlan } from '@/actions/admin'
import { ToggleSwitch } from './toggle-switch'
import { cn, formatCurrency } from '@/lib/utils'
import type { Plan } from '@/types'

interface PlanManageCardProps {
  plan: Plan
  activeSubscribers: number
}

export function PlanManageCard({ plan, activeSubscribers }: PlanManageCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const [name,        setName]        = useState(plan.name)
  const [description, setDescription] = useState(plan.description ?? '')
  const [price,       setPrice]       = useState(String(plan.price))
  const [features,    setFeatures]    = useState<string[]>(plan.features ?? [])
  const [includesCut,   setIncludesCut]   = useState(plan.includes_cut)
  const [includesBeard, setIncludesBeard] = useState(plan.includes_beard)

  const handleSave = () => {
    setError('')
    startTransition(async () => {
      const result = await updatePlan(plan.id, {
        name,
        description,
        price: parseFloat(price),
        includes_cut: includesCut,
        includes_beard: includesBeard,
        features,
      })
      if (!result.success) { setError(result.error); return }
      setEditing(false)
      router.refresh()
    })
  }

  const addFeature = () => setFeatures(f => [...f, ''])
  const removeFeature = (i: number) => setFeatures(f => f.filter((_, idx) => idx !== i))
  const updateFeature = (i: number, v: string) => setFeatures(f => f.map((s, idx) => idx === i ? v : s))

  if (editing) {
    return (
      <div className="rounded-xl border border-gold-DEFAULT/40 bg-moria-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Editando plano</h3>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Preço (R$)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" className="w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40" />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includesCut} onChange={e => setIncludesCut(e.target.checked)} className="rounded" />
              Inclui Corte
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includesBeard} onChange={e => setIncludesBeard(e.target.checked)} className="rounded" />
              Inclui Barba
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Features</label>
              <button type="button" onClick={addFeature} className="text-xs text-gold-DEFAULT hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div className="space-y-1.5">
              {features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={f}
                    onChange={e => updateFeature(i, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40"
                    placeholder="Descrição do benefício..."
                  />
                  <button type="button" onClick={() => removeFeature(i)} className="p-1.5 text-red-400 hover:bg-red-950/20 rounded-md transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
        >
          <Check className="w-4 h-4" />
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-xl border p-5 space-y-4 bg-moria-surface transition-all',
      plan.is_active ? 'border-moria-border' : 'border-moria-border/40 opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-gold-DEFAULT" />
          <h3 className="font-bold">{plan.name}</h3>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-muted-foreground hover:text-gold-DEFAULT transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preço */}
      <div>
        <p className="text-3xl font-black text-gold-DEFAULT">{formatCurrency(plan.price)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">/mês · {plan.slug}</p>
      </div>

      {/* Inclui */}
      <div className="flex gap-2">
        {plan.includes_cut && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 text-gold-DEFAULT font-medium">
            ✂ Corte
          </span>
        )}
        {plan.includes_beard && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 text-gold-DEFAULT font-medium">
            ⚡ Barba
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-1">
        {plan.features.slice(0, 3).map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3 h-3 text-gold-DEFAULT shrink-0" />
            {f}
          </li>
        ))}
        {plan.features.length > 3 && (
          <li className="text-xs text-muted-foreground pl-5">+{plan.features.length - 3} benefícios</li>
        )}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-moria-border">
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-bold">{activeSubscribers}</span>
          <span className="text-muted-foreground text-xs">assinantes</span>
        </div>
        <ToggleSwitch
          checked={plan.is_active}
          onToggle={(v) => togglePlanActive(plan.id, v).then(() => router.refresh())}
          label={plan.is_active ? 'Ativo' : 'Inativo'}
          size="sm"
        />
      </div>
    </div>
  )
}
