'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { signIn } from '@/actions/auth'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    setError('')
    startTransition(async () => {
      const result = await signIn(data)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.refresh()
      const role = result.data?.role
      if (role === 'admin')  router.push('/admin/dashboard')
      else if (role === 'barber') router.push('/barber/schedule')
      else router.push('/dashboard')
    })
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
            <h1 className="text-2xl font-black tracking-tight">Entrar na MORIA</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Erro */}
            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            {/* Botão Entrar — com glow pulsante */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2.5 bg-gold-gradient text-black font-black py-3.5 rounded-xl text-base hover:opacity-90 disabled:opacity-60 transition-opacity animate-gold-glow"
            >
              <LogIn className="w-5 h-5" />
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Botão Criar Conta */}
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2.5 border-2 border-gold-DEFAULT/40 hover:border-gold-DEFAULT/70 hover:bg-gold-DEFAULT/5 text-gold-DEFAULT font-bold py-3.5 rounded-xl text-base transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  )
}
