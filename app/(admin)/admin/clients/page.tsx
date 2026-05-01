import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Users, Crown, ChevronRight, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { SearchInput } from '@/components/admin/search-input'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { cn, formatDate } from '@/lib/utils'

export const metadata = { title: 'Clientes' }

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const query  = params.q?.trim() ?? ''
  const filter = params.filter ?? 'all'   // all | subscribers | inactive
  const page   = Math.max(1, parseInt(params.page ?? '1'))
  const limit  = 20
  const offset = (page - 1) * limit

  // Buscar clientes com assinatura ativa em join
  let qb = supabase
    .from('profiles')
    .select(`
      id, full_name, phone, whatsapp, is_active, created_at,
      subscription:subscriptions(
        id, status, expires_at,
        plan:plans(name, price)
      )
    `, { count: 'exact' })
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (query) {
    qb = qb.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,whatsapp.ilike.%${query}%`)
  }

  if (filter === 'inactive') {
    qb = qb.eq('is_active', false)
  } else {
    qb = qb.eq('is_active', true)
  }

  const { data: clients, count } = await qb

  // Filtrar subscribers no app (Supabase não suporta filter nested + eq diretamente)
  const displayed = filter === 'subscribers'
    ? (clients ?? []).filter(c =>
        (c.subscription as any[])?.some((s: any) =>
          s.status === 'active' && new Date(s.expires_at) > new Date()
        )
      )
    : (clients ?? [])

  const totalPages = Math.ceil((count ?? 0) / limit)

  const filters = [
    { key: 'all',         label: 'Todos'      },
    { key: 'subscribers', label: 'Assinantes' },
    { key: 'inactive',    label: 'Inativos'   },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie todos os clientes da barbearia"
        icon={Users}
        badge={String(count ?? 0)}
      />

      {/* Filtros + Busca */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-moria-surface border border-moria-border">
          {filters.map(f => (
            <Link
              key={f.key}
              href={`/admin/clients?filter=${f.key}${query ? `&q=${query}` : ''}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-gold-DEFAULT text-black'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <SearchInput placeholder="Buscar por nome, telefone..." className="sm:w-72" />
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-moria-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-moria-border bg-moria-elevated">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contato</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plano</th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Cadastro</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-moria-border">
            {displayed.map(client => {
              const activeSub = (client.subscription as any[])?.find(
                (s: any) => s.status === 'active' && new Date(s.expires_at) > new Date()
              )
              const plan = activeSub?.plan

              return (
                <tr
                  key={client.id}
                  className="bg-moria-surface hover:bg-moria-elevated/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                        {client.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{client.full_name}</p>
                        {activeSub && (
                          <SubscriberBadge planName={plan?.name} size="sm" className="mt-0.5" />
                        )}
                        {!client.is_active && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                            <UserX className="w-3 h-3" />
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-4 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {client.phone && <p className="text-muted-foreground text-xs">{client.phone}</p>}
                      {(client.whatsapp ?? client.phone) && (
                        <WhatsAppButton
                          phone={client.whatsapp ?? client.phone!}
                          variant="link"
                          size="sm"
                          label="WhatsApp"
                        />
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    {plan ? (
                      <div>
                        <p className="text-sm font-medium text-gold-DEFAULT">{plan.name}</p>
                        {activeSub?.expires_at && (
                          <p className="text-[10px] text-muted-foreground">
                            até {format(new Date(activeSub.expires_at), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem plano</span>
                    )}
                  </td>

                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDate(client.created_at, 'dd/MM/yyyy')}
                  </td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold-DEFAULT transition-colors"
                    >
                      Detalhes
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {displayed.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Nenhum cliente encontrado
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/clients?filter=${filter}&page=${p}${query ? `&q=${query}` : ''}`}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center border transition-colors',
                p === page
                  ? 'bg-gold-DEFAULT text-black border-gold-DEFAULT'
                  : 'border-moria-border text-muted-foreground hover:border-gold-DEFAULT/40'
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
