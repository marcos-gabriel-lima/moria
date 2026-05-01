'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { upsertService } from '@/actions/admin'

const CATEGORIES = [
  { value: 'haircut',   label: 'Corte'       },
  { value: 'beard',     label: 'Barba'       },
  { value: 'combo',     label: 'Combo'       },
  { value: 'treatment', label: 'Tratamento'  },
  { value: 'other',     label: 'Outro'       },
] as const

export function CreateServiceButton() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [coveredByCut,   setCoveredByCut]   = useState(false)
  const [coveredByBeard, setCoveredByBeard] = useState(false)

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40 transition-all'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await upsertService({
        name:             fd.get('name') as string,
        description:      fd.get('description') as string || undefined,
        category:         fd.get('category') as any,
        duration_minutes: parseInt(fd.get('duration_minutes') as string),
        price:            parseFloat(fd.get('price') as string),
        covered_by_cut:   coveredByCut,
        covered_by_beard: coveredByBeard,
        display_order:    parseInt(fd.get('display_order') as string) || 0,
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
        className="flex items-center gap-2 border border-moria-border bg-moria-elevated hover:border-gold-DEFAULT/40 text-sm font-medium px-4 py-2 rounded-lg transition-all"
      >
        <Plus className="w-4 h-4" />
        Novo Serviço
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-moria-surface border border-moria-border shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-moria-border">
              <h2 className="font-bold">Novo Serviço</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nome *</label>
                <input name="name" required className={inputCls} placeholder="Corte Social" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Categoria *</label>
                  <select name="category" required className={inputCls}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Duração (min) *</label>
                  <input name="duration_minutes" type="number" required defaultValue="30" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Preço (R$) *</label>
                  <input name="price" type="number" step="0.01" required className={inputCls} placeholder="35.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Ordem</label>
                  <input name="display_order" type="number" defaultValue="0" className={inputCls} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <input name="description" className={inputCls} placeholder="Descrição breve..." />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={coveredByCut} onChange={e => setCoveredByCut(e.target.checked)} />
                  Coberto por plano de corte
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={coveredByBeard} onChange={e => setCoveredByBeard(e.target.checked)} />
                  Coberto por plano de barba
                </label>
              </div>

              {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-moria-border text-sm">Cancelar</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60">
                  {isPending ? 'Criando...' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
