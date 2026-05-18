'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Upload } from 'lucide-react'
import { createProduct } from '@/actions/admin'

export function CreateProductButton() {
  const router  = useRouter()
  const [open, setOpen]       = useState(false)
  const [isPending, start]    = useTransition()
  const [error, setError]     = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40 transition-all'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    start(async () => {
      const result = await createProduct(fd)
      if (!result.success) { setError(result.error); return }
      setOpen(false)
      setPreview(null)
      router.refresh()
    })
  }

  const handleClose = () => {
    setOpen(false)
    setPreview(null)
    setError('')
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
              <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Upload de imagem */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Foto do produto</label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-40 rounded-xl border-2 border-dashed border-moria-border hover:border-gold-DEFAULT/50 transition-colors overflow-hidden relative flex items-center justify-center bg-moria-elevated group"
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                        <Upload className="w-5 h-5 text-white" />
                        <span className="text-xs text-white">Trocar imagem</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Clique para selecionar imagem</span>
                      <span className="text-[10px] opacity-60">JPG, PNG ou WebP · máx 5 MB</span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileRef}
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nome *</label>
                <input name="name" required className={inputCls} placeholder="Ex: Pomada Modeladora" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Preço (R$) *</label>
                <input name="price" type="number" step="0.01" min="0.01" required className={inputCls} placeholder="49.90" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea name="description" rows={2} className={`${inputCls} resize-none`} placeholder="Breve descrição do produto..." />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-lg border border-moria-border text-sm">
                  Cancelar
                </button>
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
