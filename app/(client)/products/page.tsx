import { getUser } from '@/lib/supabase/server'
import { getProductsCache } from '@/lib/queries'
import { redirect } from 'next/navigation'
import { ShoppingBag, Package, MessageCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

export const metadata = { title: 'Produtos' }

const SHOP_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5511999999999'

function productWhatsAppHref(productName: string) {
  const msg = `Olá! Tenho interesse no produto: *${productName}*. Poderia me dar mais informações?`
  return `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(msg)}`
}

export default async function ProductsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const products = await getProductsCache()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-gold-DEFAULT" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Loja</h1>
          <p className="text-sm text-muted-foreground">Produtos exclusivos da MORIA</p>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {products.map(product => (
            <div
              key={product.id}
              className="rounded-2xl border border-moria-border bg-moria-surface overflow-hidden hover:border-gold-DEFAULT/30 transition-all duration-300 flex flex-col group"
            >
              {/* Imagem */}
              <div className="relative aspect-[4/3] bg-moria-elevated overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-14 h-14 text-muted-foreground/20" />
                  </div>
                )}
                {/* Glow dourado no hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                  <span className="text-gold-DEFAULT font-black text-lg whitespace-nowrap shrink-0">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* CTA WhatsApp */}
                <a
                  href={productWhatsAppHref(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-900/30 border border-green-800/40 text-green-400 font-semibold text-sm hover:bg-green-900/50 hover:border-green-700/60 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Pedir pelo WhatsApp
                </a>
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
          <a
            href={`https://wa.me/${SHOP_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Falar no WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
