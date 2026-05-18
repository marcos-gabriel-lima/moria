'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, CheckCircle2 } from 'lucide-react'
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
        <div className="w-full max-w-sm text-center space-y-6">
          <Logo className="mx-auto" />
          <div className="p-6 rounded-xl bg-moria-surface border border-green-800/40 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <h2 className="font-bold text-lg">Conta criada!</h2>
            <p className="text-sm text-muted-foreground">
              Verifique seu e-mail para confirmar a conta e acessar a MORIA.
            </p>
            <Link
              href="/login"
              className="block w-full text-center bg-gold-gradient text-black font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const Field = ({ name, label, type = 'text', placeholder }: {
    name: keyof FormData; label: string; type?: string; placeholder?: string
  }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/50 focus:border-gold-DEFAULT/50 placeholder:text-muted-foreground/50 transition-all"
      />
      {errors[name] && (
        <p className="text-xs text-red-400">{errors[name]?.message as string}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-moria-black">
      <div className="w-full max-w-sm space-y-8">
        <Logo className="mx-auto" />

        <div className="rounded-xl bg-moria-surface border border-moria-border p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold">Criar conta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Junte-se à MORIA
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field name="full_name" label="Nome completo" placeholder="João Silva" />
            <Field name="email" label="E-mail" type="email" placeholder="seu@email.com" />

            <div className="grid grid-cols-2 gap-3">
              <Field name="phone" label="Telefone" placeholder="(11) 9 9999-9999" />
              <Field name="whatsapp" label="WhatsApp" placeholder="(11) 9 9999-9999" />
            </div>

            <Field name="password" label="Senha" type="password" placeholder="••••••" />
            <Field name="confirm_password" label="Confirmar senha" type="password" placeholder="••••••" />

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
              <UserPlus className="w-4 h-4" />
              {isPending ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-gold-DEFAULT hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
