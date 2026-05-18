'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { signIn, signInWithMagicLink } from '@/actions/auth'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [magicMode, setMagicMode] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
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
      if (role === 'admin') router.push('/admin/dashboard')
      else if (role === 'barber') router.push('/barber/schedule')
      else router.push('/dashboard')
    })
  }

  const handleMagicLink = () => {
    const email = getValues('email')
    if (!email) { setError('Digite seu e-mail'); return }
    setError('')
    startTransition(async () => {
      const result = await signInWithMagicLink(email)
      if (!result.success) { setError(result.error); return }
      setMagicSent(true)
    })
  }

  if (magicSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <Logo className="mx-auto" />
          <div className="p-6 rounded-xl bg-moria-surface border border-moria-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-gold-DEFAULT/10 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-gold-DEFAULT" />
            </div>
            <h2 className="font-bold text-lg">Link enviado!</h2>
            <p className="text-sm text-muted-foreground">
              Verifique seu e-mail e clique no link para entrar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-moria-black">
      <div className="w-full max-w-sm space-y-8">
        <Logo className="mx-auto" />

        <div className="rounded-xl bg-moria-surface border border-moria-border p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold">Entrar na MORIA</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bem-vindo de volta
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">E-mail</label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                className="w-full px-3 py-2.5 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/50 focus:border-gold-DEFAULT/50 placeholder:text-muted-foreground/50 transition-all"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/50 focus:border-gold-DEFAULT/50 placeholder:text-muted-foreground/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-gold-gradient text-black font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition-all"
            >
              <LogIn className="w-4 h-4" />
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-moria-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-moria-surface px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <button
            onClick={handleMagicLink}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 border border-moria-border hover:border-gold-DEFAULT/40 text-sm font-medium py-2.5 rounded-lg transition-all"
          >
            <Zap className="w-4 h-4 text-gold-DEFAULT" />
            Entrar com link mágico
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link href="/register" className="text-gold-DEFAULT hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
