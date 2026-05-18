import Link from 'next/link'
import Image from 'next/image'
import { Crown, Shield, Clock, ChevronRight, Check, Scissors, Star, Instagram, MessageCircle } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { FloatingCTA } from '@/components/shared/floating-cta'
import { formatCurrency } from '@/lib/utils'
import { getPlansCache, getActiveBarbersCache } from '@/lib/queries'

const SHOP_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5511999999999'
const whatsappHref  = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre a MORIA Barbearia.')}`

export default async function LandingPage() {
  const [plans, barbers] = await Promise.all([
    getPlansCache(),
    getActiveBarbersCache(),
  ])

  return (
    <div className="min-h-screen bg-moria-black text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-moria-border/60 bg-moria-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gold-gradient text-black font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background premium — overflow-hidden no filho interno para não cortar botões fixed no iOS */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient principal */}
          <div className="absolute inset-0 bg-gradient-to-br from-moria-black via-[#0d0b07] to-moria-black" />
          {/* Glow dourado superior */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-DEFAULT/8 rounded-full blur-[120px]" />
          {/* Glow lateral */}
          <div className="absolute top-1/3 -left-32 w-64 h-96 bg-gold-DEFAULT/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/3 -right-32 w-64 h-96 bg-gold-DEFAULT/4 rounded-full blur-[80px]" />
          {/* Fade para baixo */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-moria-black to-transparent" />
        </div>

        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Linha decorativa horizontal */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-DEFAULT/20 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8 py-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-DEFAULT/30 bg-gold-DEFAULT/5 text-gold-DEFAULT text-sm font-medium">
            <Crown className="w-4 h-4" />
            Barbearia Premium · Assine e agende ilimitado
          </div>

          {/* Logo */}
          <Logo size="lg" className="mx-auto" />

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tight">
            Seu estilo,{' '}
            <span className="bg-gold-gradient bg-clip-text text-transparent block sm:inline">
              sem limite.
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Assine um plano e tenha cortes e barbas ilimitados todo mês — ou agende avulso quando quiser.
            Prioridade total, sem filas, sem surpresa.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/appointments/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gold-gradient text-black font-black px-10 py-4 rounded-xl text-base hover:opacity-90 transition-opacity shadow-[0_0_60px_rgba(201,168,76,0.3)]"
            >
              <Scissors className="w-5 h-5" />
              Agendar Agora
            </Link>
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 border border-green-800/50 bg-green-950/20 text-green-400 font-semibold px-8 py-4 rounded-xl text-base hover:border-green-700/60 hover:bg-green-950/40 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gold-DEFAULT text-gold-DEFAULT" />
              ))}
              <span className="ml-1 font-medium text-foreground">5.0</span>
            </div>
            <span className="hidden sm:block w-px h-4 bg-moria-border" />
            <span>Cancele quando quiser</span>
            <span className="hidden sm:block w-px h-4 bg-moria-border" />
            <span>Sem fidelidade</span>
            <span className="hidden sm:block w-px h-4 bg-moria-border" />
            <span>Prioridade de agenda</span>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/30 animate-bounce">
          <ChevronRight className="w-5 h-5 rotate-90" />
        </div>
      </section>

      {/* ── Equipe ──────────────────────────────────────────────── */}
      {barbers.length > 0 && (
        <section className="py-24 border-t border-moria-border" id="equipe">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-bold tracking-[0.3em] text-gold-DEFAULT uppercase mb-3">Nossa Equipe</p>
              <h2 className="text-3xl sm:text-4xl font-black">
                Conheça os{' '}
                <span className="bg-gold-gradient bg-clip-text text-transparent">barbeiros</span>
              </h2>
              <p className="text-muted-foreground mt-3">Profissionais especializados prontos para te atender</p>
            </div>

            <div className={`grid gap-6 ${barbers.length === 1 ? 'max-w-sm mx-auto' : barbers.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {barbers.map((barber: any) => {
                const profile  = barber.profile as any
                const avatar   = profile?.avatar_url
                const initials = profile?.full_name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') ?? 'B'

                return (
                  <div
                    key={barber.id}
                    className="group relative flex flex-col rounded-2xl border border-moria-border bg-moria-surface overflow-hidden hover:border-gold-DEFAULT/40 transition-all duration-300"
                  >
                    {/* Foto */}
                    <div className="relative h-56 bg-gradient-to-br from-moria-elevated to-moria-surface flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gold-DEFAULT/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt={profile?.full_name ?? 'Barbeiro'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-20 rounded-full bg-gold-DEFAULT/10 border-2 border-gold-DEFAULT/30 flex items-center justify-center">
                            <span className="text-3xl font-black text-gold-DEFAULT">{initials}</span>
                          </div>
                          <Scissors className="w-5 h-5 text-gold-DEFAULT/30" />
                        </div>
                      )}
                      {/* Overlay degradê */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-moria-surface to-transparent" />
                    </div>

                    {/* Info */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col">
                      <div>
                        <h3 className="font-black text-lg">{profile?.full_name}</h3>
                        {barber.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{barber.bio}</p>
                        )}
                      </div>

                      {/* Especialidades */}
                      {barber.specialty && barber.specialty.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {barber.specialty.slice(0, 4).map((s: string) => (
                            <span
                              key={s}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/25 text-gold-DEFAULT font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Instagram */}
                      {barber.instagram && (
                        <a
                          href={`https://instagram.com/${barber.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          @{barber.instagram}
                        </a>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5">
                      <Link
                        href="/appointments/new"
                        className="block w-full text-center py-2.5 rounded-xl border border-gold-DEFAULT/30 text-gold-DEFAULT text-sm font-bold hover:bg-gold-DEFAULT/10 transition-colors"
                      >
                        Agendar com {profile?.full_name?.split(' ')[0]}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Diferenciais ────────────────────────────────────────── */}
      <section className="py-24 border-t border-moria-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.3em] text-gold-DEFAULT uppercase mb-3">Por que a MORIA?</p>
            <h2 className="text-3xl sm:text-4xl font-black">
              Feita para quem não aceita{' '}
              <span className="bg-gold-gradient bg-clip-text text-transparent">mediocridade</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Crown,
                title: 'Prioridade Total',
                desc: 'Assinantes agendam com qualquer antecedência — dias, semanas ou um mês na frente.',
                highlight: 'Sem limite de dias',
              },
              {
                icon: Scissors,
                title: 'Ilimitado de Verdade',
                desc: 'Corte ou barba quantas vezes quiser no mês. Venha toda semana se quiser.',
                highlight: 'Sem custo extra',
              },
              {
                icon: Shield,
                title: 'Sem Burocracia',
                desc: 'Cancele sua assinatura quando quiser, sem multa, sem complicação.',
                highlight: 'Cancele a qualquer hora',
              },
            ].map(({ icon: Icon, title, desc, highlight }) => (
              <div
                key={title}
                className="relative group p-6 rounded-2xl bg-moria-surface border border-moria-border hover:border-gold-DEFAULT/40 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold-DEFAULT/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gold-DEFAULT" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                  <span className="inline-block text-xs text-gold-DEFAULT bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 px-3 py-1 rounded-full font-medium">
                    {highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ──────────────────────────────────────────────── */}
      {plans.length > 0 && (
        <section className="py-24 border-t border-moria-border" id="planos">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-bold tracking-[0.3em] text-gold-DEFAULT uppercase mb-3">Planos</p>
              <h2 className="text-3xl sm:text-4xl font-black">
                Escolha seu{' '}
                <span className="bg-gold-gradient bg-clip-text text-transparent">plano</span>
              </h2>
              <p className="text-muted-foreground mt-3">
                Todos incluem prioridade de agendamento e cancelamento sem multa
              </p>
            </div>

            <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-3 max-w-4xl mx-auto'}`}>
              {plans.map((plan: any) => {
                const isFeatured = plan.slug === 'corte-barba-ilimitado'
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                      isFeatured
                        ? 'border-gold-DEFAULT bg-gradient-to-b from-gold-DEFAULT/10 to-moria-surface shadow-[0_0_60px_rgba(201,168,76,0.15)]'
                        : 'border-moria-border bg-moria-surface hover:border-gold-DEFAULT/40'
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gold-gradient text-black text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
                        <Crown className="w-3 h-3" />
                        MAIS POPULAR
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black">{formatCurrency(plan.price)}</span>
                        <span className="text-muted-foreground mb-1.5">/mês</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <Check className="w-4 h-4 text-gold-DEFAULT shrink-0 mt-0.5" />
                          <span className="text-foreground/80">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/register"
                      className={`block text-center py-3 rounded-xl font-bold transition-all ${
                        isFeatured
                          ? 'bg-gold-gradient text-black hover:opacity-90 shadow-[0_0_25px_rgba(201,168,76,0.3)]'
                          : 'border border-moria-border hover:border-gold-DEFAULT/50 text-foreground'
                      }`}
                    >
                      Assinar Agora
                    </Link>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 max-w-2xl mx-auto flex items-start gap-3 p-4 rounded-xl bg-moria-surface border border-moria-border text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <p>
                <strong className="text-foreground">Assinantes têm prioridade:</strong>{' '}
                agendam com qualquer antecedência. Sem plano, agendamento limitado a{' '}
                <strong className="text-foreground">48 horas</strong> de antecedência.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Como funciona ───────────────────────────────────────── */}
      <section className="py-24 border-t border-moria-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.3em] text-gold-DEFAULT uppercase mb-3">Simples assim</p>
            <h2 className="text-3xl sm:text-4xl font-black">Como funciona</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Crie sua conta', desc: 'Cadastro rápido com e-mail. Sem cartão de crédito para começar.' },
              { step: '02', title: 'Escolha um plano', desc: 'Selecione o plano ideal e comece a aproveitar imediatamente — ou agende avulso.' },
              { step: '03', title: 'Agende e apareça', desc: 'Escolha o barbeiro, o horário e pronto. Nada mais.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/30 flex items-center justify-center mx-auto">
                  <span className="text-xl font-black text-gold-DEFAULT">{step}</span>
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────────── */}
      <section className="py-24 border-t border-moria-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black">
            Pronto para entrar na{' '}
            <span className="bg-gold-gradient bg-clip-text text-transparent">MORIA?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Junte-se e nunca mais se preocupe com quanto vai gastar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/appointments/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gold-gradient text-black font-black px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_40px_rgba(201,168,76,0.2)]"
            >
              <Scissors className="w-5 h-5" />
              Agendar Agora
            </Link>
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-green-800/50 text-green-400 font-semibold px-8 py-4 rounded-xl hover:bg-green-950/20 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-gold-DEFAULT hover:underline">
              Entrar →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-moria-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#planos" className="hover:text-foreground transition-colors">Planos</Link>
            <Link href="#equipe" className="hover:text-foreground transition-colors">Equipe</Link>
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MORIA Barbearia
          </p>
        </div>
      </footer>

      {/* ── Botões flutuantes ────────────────────────────────────── */}
      <FloatingCTA whatsappHref={whatsappHref} />
    </div>
  )
}
