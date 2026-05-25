'use client'

import { useState, useTransition } from 'react'
import { Mail, Check, Loader2 } from 'lucide-react'
import { resendBarberWelcomeEmail } from '@/actions/admin'

interface Props {
  barberId: string
}

export function ResendInviteButton({ barberId }: Props) {
  const [isPending, start] = useTransition()
  const [done,  setDone]  = useState(false)
  const [error, setError] = useState('')

  function handleClick() {
    if (done) return
    setError('')
    start(async () => {
      const res = await resendBarberWelcomeEmail(barberId)
      if (!res.success) {
        setError(res.error)
        return
      }
      setDone(true)
      setTimeout(() => setDone(false), 4000)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={error || 'Reenviar email de boas-vindas (definir senha)'}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-moria-border text-muted-foreground hover:text-gold-DEFAULT hover:border-gold-DEFAULT/40 transition-colors disabled:opacity-60"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
        done    ? <Check    className="w-3.5 h-3.5 text-green-400" /> :
                  <Mail     className="w-3.5 h-3.5" />}
      {done ? 'Enviado' : 'Reenviar convite'}
    </button>
  )
}
