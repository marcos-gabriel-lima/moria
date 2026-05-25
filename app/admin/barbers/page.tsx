import { Suspense } from 'react'
import Link from 'next/link'
import { Scissors, ChevronRight, Instagram } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { BarberToggle } from '@/components/admin/barber-toggle'
import { ResendInviteButton } from '@/components/admin/resend-invite-button'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { CreateBarberButton } from '@/components/admin/create-barber-button'
import { getAdminBarbers } from '@/lib/queries'
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

function BarbersSkeleton() {
  return (
    <div className="grid gap-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-moria-border bg-moria-surface p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-moria-elevated" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-moria-elevated rounded" />
              <div className="h-3 w-56 bg-moria-elevated rounded" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-moria-border grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-8 bg-moria-elevated rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

async function BarbersList() {
  const { barbers, aptCounts } = await getAdminBarbers()

  if (!barbers.length) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Nenhum barbeiro cadastrado
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {barbers.map((barber: any) => {
        const profile   = barber.profile as any
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
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-moria-elevated border border-moria-border flex items-center justify-center shrink-0 text-lg font-black text-muted-foreground overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
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
                    {(profile?.whatsapp || profile?.phone) && (
                      <WhatsAppButton
                        phone={profile.whatsapp ?? profile.phone}
                        variant="link"
                        size="sm"
                      />
                    )}
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

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 shrink-0">
                <Link
                  href={`/admin/barbers/${barber.id}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gold-DEFAULT transition-colors order-first sm:order-none"
                >
                  Editar <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <ResendInviteButton barberId={barber.id} />
                <BarberToggle barberId={barber.id} isActive={barber.is_active} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-moria-border grid grid-cols-3 gap-2 sm:gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Horário</p>
                <p className="font-medium">
                  {barber.start_time?.slice(0, 5)} – {barber.end_time?.slice(0, 5)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Comissão</p>
                <p className="font-medium">{barber.commission_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cortes no mês</p>
                <p className="font-bold text-gold-DEFAULT">{monthCuts}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-1.5 flex-wrap">
              {DAYS.map(({ key, short }) => (
                <span
                  key={key}
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded border font-medium',
                    barber[key]
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
    </div>
  )
}

export default function AdminBarbersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Barbeiros"
        description="Gerencie a equipe da barbearia"
        icon={Scissors}
        actions={<CreateBarberButton />}
      />

      <Suspense fallback={<BarbersSkeleton />}>
        <BarbersList />
      </Suspense>
    </div>
  )
}
