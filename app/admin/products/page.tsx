import { Suspense } from 'react'
import { ShoppingBag } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { ProductManageCard } from '@/components/admin/product-manage-card'
import { CreateProductButton } from '@/components/admin/create-product-button'
import { getAdminProducts } from '@/lib/queries'

export const metadata = { title: 'Produtos' }

function ProductsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl bg-moria-surface border border-moria-border p-4 h-20" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-moria-border bg-moria-surface h-48" />
        ))}
      </div>
    </div>
  )
}

async function ProductsContent() {
  const products = await getAdminProducts()

  const active   = products.filter((p: any) => p.is_active).length
  const inactive = products.filter((p: any) => !p.is_active).length
  const lowStock = products.filter((p: any) => p.is_active && p.stock <= 3).length

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-moria-surface border border-moria-border p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-black text-gold-DEFAULT">{active}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Ativos</p>
        </div>
        <div className="rounded-xl bg-moria-surface border border-moria-border p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-black text-muted-foreground">{inactive}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Inativos</p>
        </div>
        <div className={`rounded-xl bg-moria-surface border p-3 sm:p-4 text-center ${lowStock > 0 ? 'border-red-500/30' : 'border-moria-border'}`}>
          <p className={`text-xl sm:text-2xl font-black ${lowStock > 0 ? 'text-red-400' : 'text-foreground'}`}>
            {lowStock}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Estoque baixo</p>
        </div>
      </div>

      {products.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product: any) => (
            <ProductManageCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl bg-moria-surface border border-moria-border">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum produto cadastrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Clique em "Novo Produto" para começar
          </p>
        </div>
      )}
    </>
  )
}

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo de produtos da barbearia"
        icon={ShoppingBag}
        actions={<CreateProductButton />}
      />

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
