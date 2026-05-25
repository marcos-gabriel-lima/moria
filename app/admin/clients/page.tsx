import { Suspense } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Users, ChevronRight, UserX } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { SearchInput } from '@/components/admin/search-input'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { getAdminClients } from '@/lib/queries'
import { cn, formatDate } from '@/lib/utils'

export const metadata = { title: 'Clientes' }

const LIMIT = 20

const FILTERS = [
  { key: 'all',         label: 'Todos'      },
  { key: 'subscribers', label: 'Assinantes' },
  { key: 'inactive',    label: 'Inativos'   },
]

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-moria-border overflow-hidden animate-pulse">
      <div className="h-10 bg-moria-elevated border-b border-moria-border" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-16 bg-moria-surface border-b border-moria-border last:border-0" />
      ))}
    </div>
  )
}

async function ClientsTable({
  page,
  query,
  filter,
}: {
  page: number
  query: string
  filter: string
}) {
  const { clients, count } = await getAdminClients(page, LIMIT, query, filter)
  const totalPages = Math.ceil(count / LIMIT)
  const now = new Date()

  return (
    <>
      <div className="rounded-xl border border-moria-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-moria-border bg-moria-elevated">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente{' '}
                <span className="font-normal normal-case text-muted-foreground/50">({count})</span>
              </th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Contato
              </th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Plano
              </th>
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Cadastro
              </th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-moria-border">
            {clients.map((client: any) => {
              const activeSub = (client.subscription as any[])?.find(
                (s: any) => s.status === 'active' && new Date(s.expires_at) > now
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
                      {client.phone && (
                        <p className="text-muted-foreground text-xs">{client.phone}</p>
                      )}
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

        {clients.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Nenhum cliente encontrado
          </div>
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/clients?filter=${filter}&page=${p}${query ? `&q=${query}` : ''}`}
              className={cn(
                'min-w-[40px] h-10 px-2 rounded-lg text-sm font-medium flex items-center justify-center border transition-colors',
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
    </>
  )
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>
}) {
  const params = await searchParams
  const query  = params.q?.trim() ?? ''
  const filter = params.filter ?? 'all'
  const page   = Math.max(1, parseInt(params.page ?? '1'))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie todos os clientes da barbearia"
        icon={Users}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-moria-surface border border-moria-border">
          {FILTERS.map(f => (
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

      <Suspense fallback={<TableSkeleton />}>
        <ClientsTable page={page} query={query} filter={filter} />
      </Suspense>
    </div>
  )
}
