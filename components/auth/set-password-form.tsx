'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { setOwnPassword } from '@/actions/auth'

export function SetPasswordForm() {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    const password = (formData.get('password') as string) ?? ''
    const confirm  = (formData.get('confirm') as string) ?? ''

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setError('')

    start(async () => {
      const res = await setOwnPassword(password)
      if (!res.success) {
        setError(res.error)
        return
      }
      // Layout do destino decide pra onde mandar com base no role.
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="text-xs text-muted-foreground mb-1.5 block">
          Nova senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            id="password"
            name="password"
            type="password"
            minLength={6}
            maxLength={128}
            required
            autoFocus
            autoComplete="new-password"
            className="w-full bg-moria-elevated border border-moria-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirm" className="text-xs text-muted-foreground mb-1.5 block">
          Confirme a senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            id="confirm"
            name="confirm"
            type="password"
            minLength={6}
            maxLength={128}
            required
            autoComplete="new-password"
            className="w-full bg-moria-elevated border border-moria-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/50"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-lg bg-gold-DEFAULT text-moria-black font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {isPending ? 'Salvando...' : 'Salvar senha'}
      </button>
    </form>
  )
}
