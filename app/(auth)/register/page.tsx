'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, UserPlus, LogIn, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { signUp } from '@/actions/auth'

const schema = z.object({
  full_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    setError('')
    startTransition(async () => {
      const result = await signUp(data)
      if (!result.success) { setError(result.error); return }
      if (result.data?.session) {
        router.refresh()
        router.push('/dashboard')
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-moria-black">
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] bg-gold-DEFAULT/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative w-full max-w-sm text-center space-y-8">
          <Logo className="mx-auto" />
          <div className="rounded-2xl bg-moria-surface border border-green-800/40 p-7 space-y-4 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
            <h2 className="font-black text-xl">Conta criada!</h2>
            <p className="text-sm text-muted-foreground">
              Verifique seu e-mail para confirmar a conta e acessar a MORIA.
            </p>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2.5 bg-gold-gradient text-black font-black py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity animate-gold-glow"
            >
              <LogIn className="w-5 h-5" />
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-moria-black">
      {/* Glow de fundo */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-gold-DEFAULT/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        <Logo className="mx-auto" />

        <div className="rounded-2xl bg-moria-surface border border-moria-border/80 p-7 space-y-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tight">Criar conta na MORIA</h1>
            <p className="text-sm text-muted-foreground">Junte-se à barbearia</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome completo</label>
              <input
                {...register('full_name')}
                type="text"
                placeholder="João Silva"
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT/40 focus:border-gold-DEFAULT/60 placeholder:text-muted-foreground/50 transition-all"
              />
              {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">E-mail</label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT/40 focus:border-gold-DEFAULT/60 placeholder:text-muted-foreground/50 transition-all"
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Telefone + WhatsApp */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Telefone</label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  autoComplete="tel"
                  className="w-full px-4 py-3 rounded-xl bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT/40 focus:border-gold-DEFAULT/60 placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">WhatsApp</label>
                <input
                  {...register('whatsapp')}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT/40 focus:border-gold-DEFAULT/60 placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT/40 focus:border-gold-DEFAULT/60 placeholder:text-muted-foreground/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirmar senha</label>
              <div className="relative">
                <input
                  {...register('confirm_password')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT/40 focus:border-gold-DEFAULT/60 placeholder:text-muted-foreground/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-xs text-red-400">{errors.confirm_password.message}</p>}
            </div>

            {/* Erro */}
            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            {/* Botão Criar Conta — com glow pulsante */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2.5 bg-gold-gradient text-black font-black py-3.5 rounded-xl text-base hover:opacity-90 disabled:opacity-60 transition-opacity animate-gold-glow"
            >
              <UserPlus className="w-5 h-5" />
              {isPending ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          {/* Botão Já tenho conta */}
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2.5 border-2 border-gold-DEFAULT/40 hover:border-gold-DEFAULT/70 hover:bg-gold-DEFAULT/5 text-gold-DEFAULT font-bold py-3.5 rounded-xl text-base transition-all"
          >
            <LogIn className="w-5 h-5" />
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  )
}
