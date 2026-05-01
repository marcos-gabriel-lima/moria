'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Minus } from 'lucide-react'
import { createPlan } from '@/actions/admin'

export function CreatePlanButton() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [features, setFeatures] = useState<string[]>([''])
  const [includesCut,   setIncludesCut]   = useState(false)
  const [includesBeard, setIncludesBeard] = useState(false)

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40 transition-all'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await createPlan({
        name: fd.get('name') as string,
        slug: fd.get('slug') as string,
        description: fd.get('description') as string,
        price: parseFloat(fd.get('price') as string),
        includes_cut: includesCut,
        includes_beard: includesBeard,
        features: features.filter(f => f.trim()),
        display_order: parseInt(fd.get('display_order') as string) || 0,
      })
      if (!result.success) { setError(result.error); return }
      setOpen(false)
      window.location.reload()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gold-gradient text-black font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Novo Plano
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-moria-surface border border-moria-border shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-moria-border">
              <h2 className="font-bold">Novo Plano</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Nome *</label>
                  <input name="name" required className={inputCls} placeholder="Corte Ilimitado" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Slug *</label>
                  <input name="slug" required className={inputCls} placeholder="corte-ilimitado" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Preço (R$) *</label>
                  <input name="price" type="number" step="0.01" required className={inputCls} placeholder="150.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Ordem</label>
                  <input name="display_order" type="number" defaultValue="0" className={inputCls} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea name="description" rows={2} className={`${inputCls} resize-none`} />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={includesCut} onChange={e => setIncludesCut(e.target.checked)} />
                  Inclui Corte
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={includesBeard} onChange={e => setIncludesBeard(e.target.checked)} />
                  Inclui Barba
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Features</label>
                  <button type="button" onClick={() => setFeatures(f => [...f, ''])} className="text-xs text-gold-DEFAULT hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                {features.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={f}
                      onChange={e => setFeatures(prev => prev.map((s, idx) => idx === i ? e.target.value : s))}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40"
                      placeholder="Ex: Cortes ilimitados"
                    />
                    <button type="button" onClick={() => setFeatures(f => f.filter((_, idx) => idx !== i))} className="p-1.5 text-red-400 hover:bg-red-950/20 rounded-md">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-moria-border text-sm">Cancelar</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60">
                  {isPending ? 'Criando...' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
