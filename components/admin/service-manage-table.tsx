'use client'

import { useRouter } from 'next/navigation'
import { Check, Scissors } from 'lucide-react'
import { toggleServiceActive } from '@/actions/admin'
import { ToggleSwitch } from './toggle-switch'
import { cn, formatCurrency } from '@/lib/utils'
import type { Service } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  haircut:   'Corte',
  beard:     'Barba',
  combo:     'Combo',
  treatment: 'Tratamento',
  other:     'Outro',
}

interface ServiceManageTableProps {
  services: Service[]
}

export function ServiceManageTable({ services }: ServiceManageTableProps) {
  return (
    <div className="rounded-xl border border-moria-border overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-moria-border bg-moria-elevated">
            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serviço</th>
            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Categoria</th>
            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duração</th>
            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço</th>
            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Cobre plano</th>
            <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ativo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-moria-border">
          {services.map(svc => (
            <ServiceRow key={svc.id} service={svc} />
          ))}
        </tbody>
      </table>
      </div>
      {services.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Nenhum serviço cadastrado
        </div>
      )}
    </div>
  )
}

function ServiceRow({ service: svc }: { service: Service }) {
  const router = useRouter()

  return (
    <tr className={cn(
      'bg-moria-surface hover:bg-moria-elevated/50 transition-colors',
      !svc.is_active && 'opacity-50'
    )}>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">{svc.name}</p>
            {svc.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{svc.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className="text-xs px-2 py-0.5 rounded-full bg-moria-elevated border border-moria-border text-muted-foreground">
          {CATEGORY_LABELS[svc.category] ?? svc.category}
        </span>
      </td>
      <td className="p-4 text-muted-foreground">{svc.duration_minutes} min</td>
      <td className="p-4 font-bold">{formatCurrency(svc.price)}</td>
      <td className="p-4 hidden lg:table-cell">
        <div className="flex gap-1.5">
          {svc.covered_by_cut && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 text-gold-DEFAULT">
              ✂ Corte
            </span>
          )}
          {svc.covered_by_beard && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 text-gold-DEFAULT">
              ⚡ Barba
            </span>
          )}
          {!svc.covered_by_cut && !svc.covered_by_beard && (
            <span className="text-xs text-muted-foreground/40">—</span>
          )}
        </div>
      </td>
      <td className="p-4">
        <ToggleSwitch
          checked={svc.is_active}
          onToggle={(v) => toggleServiceActive(svc.id, v).then(() => router.refresh())}
          size="sm"
        />
      </td>
    </tr>
  )
}
