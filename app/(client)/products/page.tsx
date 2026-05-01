import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingBag, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Produtos' }

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-gold-DEFAULT" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Produtos</h1>
          <p className="text-sm text-muted-foreground">Produtos exclusivos da MORIA</p>
        </div>
      </div>

      {products && products.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="rounded-xl border border-moria-border bg-moria-surface overflow-hidden hover:border-gold-DEFAULT/30 transition-colors group">
              <div className="aspect-square bg-moria-elevated flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-12 h-12 text-muted-foreground/30" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">{product.name}</h3>
                  <span className="text-gold-DEFAULT font-black whitespace-nowrap">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                {product.description && (
                  <p className="text-xs text-muted-foreground">{product.description}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    product.stock > 0
                      ? 'text-green-400 bg-green-950/30 border-green-800/30'
                      : 'text-red-400 bg-red-950/30 border-red-800/30'
                  }`}>
                    {product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
                  </span>
                  {product.stock > 0 && (
                    <button className="text-xs bg-gold-gradient text-black font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                      Comprar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-moria-surface border border-moria-border flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Em breve</p>
            <p className="text-sm text-muted-foreground">
              Nossos produtos exclusivos chegarão em breve. Fique ligado!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
