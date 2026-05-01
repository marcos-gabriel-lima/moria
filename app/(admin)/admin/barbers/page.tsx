import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Scissors, ChevronRight, Instagram } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { BarberToggle } from '@/components/admin/barber-toggle'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { CreateBarberButton } from '@/components/admin/create-barber-button'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Barbeiros' }

const DAYS = [
  { key: 'works_monday',    short: 'Seg' },
  { key: 'works_tuesday',   short: 'Ter' },
  { key: 'works_wednesday', short: 'Qua' },
  { key: 'works_thursday',  short: 'Qui' },
  { key: 'works_friday',    short: 'Sex' },
  { key: 'works_saturday',  short: 'Sáb' },
  { key: 'works_sunday',    short: 'Dom' },
]

export default async function AdminBarbersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbers } = await supabase
    .from('barbers')
    .select('*, profile:profiles(id, full_name, phone, whatsapp, avatar_url, created_at)')
    .order('is_active', { ascending: false })

  // Contar agendamentos de cada barbeiro no mês
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const aptCounts: Record<string, number> = {}
  if (barbers?.length) {
    const { data: counts } = await supabase
      .from('appointments')
      .select('barber_id')
      .in('barber_id', barbers.map(b => b.id))
      .eq('status', 'completed')
      .gte('scheduled_at', monthStart)
      .lte('scheduled_at', monthEnd)

    counts?.forEach(c => {
      aptCounts[c.barber_id] = (aptCounts[c.barber_id] ?? 0) + 1
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barbeiros"
        description="Gerencie a equipe da barbearia"
        icon={Scissors}
        badge={String(barbers?.length ?? 0)}
        actions={<CreateBarberButton />}
      />

      <div className="grid gap-4">
        {barbers?.map(barber => {
          const profile = barber.profile as any
          const monthCuts = aptCounts[barber.id] ?? 0

          return (
            <div
              key={barber.id}
              className={cn(
                'rounded-xl border bg-moria-surface p-5 transition-colors',
                barber.is_active ? 'border-moria-border' : 'border-moria-border/40 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Perfil */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center shrink-0 text-lg font-black text-muted-foreground">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                      : profile?.full_name?.charAt(0)
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{profile?.full_name}</h3>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border font-semibold',
                        barber.is_active
                          ? 'text-green-400 bg-green-950/30 border-green-800/30'
                          : 'text-red-400 bg-red-950/30 border-red-800/30'
                      )}>
                        {barber.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {barber.specialty?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {barber.specialty.join(' · ')}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {profile?.whatsapp || profile?.phone ? (
                        <WhatsAppButton
                          phone={profile.whatsapp ?? profile.phone}
                          variant="link"
                          size="sm"
                        />
                      ) : null}
                      {barber.instagram && (
                        <a
                          href={`https://instagram.com/${barber.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-pink-400 transition-colors"
                        >
                          <Instagram className="w-3 h-3" />
                          {barber.instagram}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-3 shrink-0">
                  <BarberToggle
                    barberId={barber.id}
                    isActive={barber.is_active}
                  />
                  <Link
                    href={`/admin/barbers/${barber.id}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gold-DEFAULT transition-colors"
                  >
                    Editar <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Detalhes */}
              <div className="mt-4 pt-4 border-t border-moria-border grid grid-cols-3 gap-4 text-sm">
                {/* Horário */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Horário</p>
                  <p className="font-medium">{barber.start_time?.slice(0, 5)} – {barber.end_time?.slice(0, 5)}</p>
                </div>

                {/* Comissão */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comissão</p>
                  <p className="font-medium">{barber.commission_rate}%</p>
                </div>

                {/* Cortes no mês */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cortes no mês</p>
                  <p className="font-bold text-gold-DEFAULT">{monthCuts}</p>
                </div>
              </div>

              {/* Dias de trabalho */}
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {DAYS.map(({ key, short }) => (
                  <span
                    key={key}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded border font-medium',
                      (barber as any)[key]
                        ? 'text-gold-DEFAULT bg-gold-DEFAULT/10 border-gold-DEFAULT/20'
                        : 'text-muted-foreground/40 bg-moria-elevated border-moria-border/30'
                    )}
                  >
                    {short}
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {!barbers?.length && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nenhum barbeiro cadastrado
          </div>
        )}
      </div>
    </div>
  )
}
