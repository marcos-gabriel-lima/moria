import Link from 'next/link'
import { Crown, Shield, Clock, ChevronRight, Check, Scissors, Zap, Star } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { formatCurrency } from '@/lib/utils'
import { DEMO_PLANS } from '@/lib/demo-data'

async function getPlans() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || url.includes('xxxx') || !key || key.startsWith('eyJ') === false) {
    return DEMO_PLANS
  }
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('display_order')
    return data && data.length > 0 ? data : DEMO_PLANS
  } catch {
    return DEMO_PLANS
  }
}

export default async function LandingPage() {
  const plans = await getPlans()

  return (
    <div className="min-h-screen bg-moria-black text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-moria-border/60 bg-moria-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/demo" className="text-sm text-gold-DEFAULT/80 hover:text-gold-DEFAULT transition-colors hidden sm:flex items-center gap-1.5 border border-gold-DEFAULT/30 px-3 py-1.5 rounded-lg hover:border-gold-DEFAULT/60">
              <span>Ver Demo</span>
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
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

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-DEFAULT/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-crimson-DEFAULT/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#0A0A0A)]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8 py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-DEFAULT/30 bg-gold-DEFAULT/5 text-gold-DEFAULT text-sm font-medium">
            <Crown className="w-4 h-4" />
            Barbearia Premium com Planos de Assinatura
          </div>

          <Logo size="lg" className="mx-auto" />

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight">
            Seu estilo,{' '}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              ilimitado
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Assine um plano e tenha cortes e barbas ilimitados todo mês.
            Prioridade de agendamento, sem filas, sem limite.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gold-gradient text-black font-black px-8 py-4 rounded-xl text-base hover:opacity-90 transition-opacity shadow-[0_0_40px_rgba(201,168,76,0.25)]"
            >
              <Crown className="w-5 h-5" />
              Assinar Agora
            </Link>
            <Link
              href="/appointments/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-moria-border bg-moria-surface text-foreground font-semibold px-8 py-4 rounded-xl text-base hover:border-gold-DEFAULT/40 transition-colors"
            >
              <Scissors className="w-5 h-5" />
              Agendar sem plano
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gold-DEFAULT text-gold-DEFAULT" />
              ))}
              <span className="ml-1">5.0</span>
            </div>
            <span className="w-px h-4 bg-moria-border" />
            <span>Sem fidelidade</span>
            <span className="w-px h-4 bg-moria-border" />
            <span>Cancele quando quiser</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40 animate-bounce">
          <ChevronRight className="w-5 h-5 rotate-90" />
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 border-t border-moria-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Por que a{' '}
              <span className="bg-gold-gradient bg-clip-text text-transparent">MORIA?</span>
            </h2>
            <p className="text-muted-foreground">Feita para quem não aceita mediocridade</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Crown,
                title: 'Prioridade Total',
                desc: 'Assinantes agendam com qualquer antecedência — dias, semanas ou até um mês na frente.',
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
                desc: 'Cancele sua assinatura quando quiser, sem multa, sem complicação. Simples assim.',
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

      {/* Planos */}
      {plans && plans.length > 0 && (
        <section className="py-20 border-t border-moria-border" id="planos">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-3">
                Escolha seu{' '}
                <span className="bg-gold-gradient bg-clip-text text-transparent">Plano</span>
              </h2>
              <p className="text-muted-foreground">
                Todos incluem prioridade de agendamento e cancelamento sem multa
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {plans.map(plan => {
                const isFeatured = plan.slug === 'corte-barba-ilimitado'
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                      isFeatured
                        ? 'border-gold-DEFAULT bg-gradient-to-b from-gold-DEFAULT/10 to-moria-surface shadow-[0_0_50px_rgba(201,168,76,0.15)]'
                        : 'border-moria-border bg-moria-surface hover:border-gold-DEFAULT/40'
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gold-gradient text-black text-xs font-black px-3 py-1 rounded-full">
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
                        <span className="text-4xl font-black">{formatCurrency(plan.price).replace('R$\xa0', 'R$ ')}</span>
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
                          ? 'bg-gold-gradient text-black hover:opacity-90 shadow-[0_0_20px_rgba(201,168,76,0.3)]'
                          : 'border border-moria-border hover:border-gold-DEFAULT/50 text-foreground'
                      }`}
                    >
                      Assinar Agora
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Regra 48h */}
            <div className="mt-8 max-w-2xl mx-auto flex items-start gap-3 p-4 rounded-xl bg-moria-surface border border-moria-border text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <p>
                <strong className="text-foreground">Assinantes têm prioridade:</strong>{' '}
                agendam com qualquer antecedência. Sem plano, o agendamento fica limitado a{' '}
                <strong className="text-foreground">48 horas</strong> de antecedência.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section className="py-20 border-t border-moria-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Como funciona</h2>
            <p className="text-muted-foreground">Em 3 passos simples</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crie sua conta', desc: 'Cadastro rápido com e-mail. Sem cartão de crédito para começar.' },
              { step: '02', title: 'Escolha um plano', desc: 'Selecione o plano ideal para você e pague por Pix ou cartão.' },
              { step: '03', title: 'Agende e apareça', desc: 'Marque seu horário quando quiser e apareça. Seu barbeiro te espera.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gold-DEFAULT/10 border border-gold-DEFAULT/30 flex items-center justify-center mx-auto">
                  <span className="text-lg font-black text-gold-DEFAULT">{step}</span>
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 border-t border-moria-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Pronto para entrar na{' '}
            <span className="bg-gold-gradient bg-clip-text text-transparent">MORIA?</span>
          </h2>
          <p className="text-muted-foreground">
            Junte-se e nunca mais preocupe com quanto vai gastar no mês.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gold-gradient text-black font-black px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Criar conta grátis
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Já tenho conta →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-moria-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MORIA Barbearia · Todos os direitos reservados
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
