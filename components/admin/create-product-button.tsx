'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createProduct } from '@/actions/admin'

export function CreateProductButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40 transition-all'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await createProduct({
        name:        fd.get('name') as string,
        description: fd.get('description') as string,
        price:       parseFloat(fd.get('price') as string),
        stock:       parseInt(fd.get('stock') as string) || 0,
        category:    fd.get('category') as string,
        image_url:   fd.get('image_url') as string,
      })
      if (!result.success) { setError(result.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gold-gradient text-black font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Novo Produto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-moria-surface border border-moria-border shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-moria-border">
              <h2 className="font-bold">Novo Produto</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nome *</label>
                <input name="name" required className={inputCls} placeholder="Ex: Pomada Modeladora" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Preço (R$) *</label>
                  <input name="price" type="number" step="0.01" min="0.01" required className={inputCls} placeholder="49.90" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Estoque inicial</label>
                  <input name="stock" type="number" min="0" defaultValue="0" className={inputCls} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <input name="category" className={inputCls} placeholder="Ex: Pomadas, Perfumes, Acessórios" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea name="description" rows={2} className={`${inputCls} resize-none`} placeholder="Breve descrição do produto..." />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">URL da imagem</label>
                <input name="image_url" className={inputCls} placeholder="https://..." />
              </div>

              {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-moria-border text-sm">Cancelar</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60">
                  {isPending ? 'Criando...' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
