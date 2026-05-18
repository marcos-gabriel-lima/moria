'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Edit2, Check, X, Plus, Minus, Upload } from 'lucide-react'
import { toggleProductActive, updateProduct, adjustStock, uploadProductImage } from '@/actions/admin'
import { ToggleSwitch } from './toggle-switch'
import { cn, formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  is_active: boolean
}

export function ProductManageCard({ product }: { product: Product }) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [editing, setEditing]     = useState(false)
  const [error, setError]         = useState('')
  const [name,        setName]        = useState(product.name)
  const [description, setDescription] = useState(product.description ?? '')
  const [price,       setPrice]       = useState(String(product.price))
  const [imgPreview,  setImgPreview]  = useState<string | null>(null)
  const [imgFile,     setImgFile]     = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40 transition-all'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  const handleSave = () => {
    setError('')
    start(async () => {
      // 1. Upload da imagem, se houver nova
      if (imgFile) {
        const fd = new FormData()
        fd.set('image', imgFile)
        const imgResult = await uploadProductImage(product.id, fd)
        if (!imgResult.success) { setError(imgResult.error); return }
      }

      // 2. Salva campos de texto
      const result = await updateProduct(product.id, {
        name,
        description: description || undefined,
        price: parseFloat(price),
      })
      if (!result.success) { setError(result.error); return }

      setEditing(false)
      setImgFile(null)
      router.refresh()
    })
  }

  const handleStock = (delta: number) => {
    start(async () => {
      await adjustStock(product.id, delta)
      router.refresh()
    })
  }

  const currentImage = imgPreview ?? product.image_url

  if (editing) {
    return (
      <div className="rounded-xl border border-gold-DEFAULT/40 bg-moria-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Editando produto</h3>
          <button onClick={() => { setEditing(false); setImgFile(null); setImgPreview(null) }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Imagem */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Foto do produto</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 rounded-xl border-2 border-dashed border-moria-border hover:border-gold-DEFAULT/50 transition-colors overflow-hidden relative flex items-center justify-center bg-moria-elevated group"
          >
            {currentImage ? (
              <>
                <img src={currentImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-xs text-white">Trocar imagem</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-5 h-5" />
                <span className="text-xs">Adicionar foto</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          {imgFile && (
            <p className="text-[10px] text-gold-DEFAULT">✓ Nova imagem selecionada</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Preço (R$) *</label>
            <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
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
      'rounded-xl border bg-moria-surface p-5 space-y-4 transition-all',
      product.is_active ? 'border-moria-border' : 'border-moria-border/40 opacity-60'
    )}>
      {/* Imagem + Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-moria-elevated border border-moria-border flex items-center justify-center shrink-0 overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-7 h-7 text-muted-foreground/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-muted-foreground hover:text-gold-DEFAULT transition-colors shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xl font-black text-gold-DEFAULT mt-1">{formatCurrency(product.price)}</p>
        </div>
      </div>

      {product.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
      )}

      {/* Estoque */}
      <div className="flex items-center justify-between pt-3 border-t border-moria-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Estoque</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStock(-1)}
              disabled={isPending || product.stock === 0}
              className="w-7 h-7 rounded-md border border-moria-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold-DEFAULT/40 disabled:opacity-40 transition-all"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className={cn('font-bold text-sm w-8 text-center', product.stock === 0 ? 'text-red-400' : 'text-foreground')}>
              {product.stock}
            </span>
            <button
              onClick={() => handleStock(+1)}
              disabled={isPending}
              className="w-7 h-7 rounded-md border border-moria-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold-DEFAULT/40 disabled:opacity-40 transition-all"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <ToggleSwitch
          checked={product.is_active}
          onToggle={(v) => toggleProductActive(product.id, v).then(() => router.refresh())}
          label={product.is_active ? 'Ativo' : 'Inativo'}
          size="sm"
        />
      </div>
    </div>
  )
}
