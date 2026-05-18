'use client'

import { useState, useTransition } from 'react'
import { Ban, X, Loader2 } from 'lucide-react'
import { createBlockedSlot } from '@/actions/barber'

interface BlockSlotButtonProps {
  currentDate: string
  onSuccess?: () => void
}

export function BlockSlotButton({ currentDate, onSuccess }: BlockSlotButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd      = new FormData(e.currentTarget)
    const startT  = fd.get('start_time') as string
    const endT    = fd.get('end_time')   as string
    const reason  = (fd.get('reason') as string).trim() || undefined

    const starts_at = `${currentDate}T${startT}:00.000Z`
    const ends_at   = `${currentDate}T${endT}:00.000Z`

    startTransition(async () => {
      const result = await createBlockedSlot({ starts_at, ends_at, reason })
      if (result.success) {
        setOpen(false)
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-moria-border text-muted-foreground hover:border-red-800/40 hover:text-red-400 transition-colors"
      >
        <Ban className="w-3.5 h-3.5" />
        Bloquear horário
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-moria-border bg-moria-surface p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Bloquear Horário</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-moria-elevated transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Início</label>
                  <input
                    type="time"
                    name="start_time"
                    required
                    className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Fim</label>
                  <input
                    type="time"
                    name="end_time"
                    required
                    className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  name="reason"
                  maxLength={100}
                  placeholder="Ex: Almoço, reunião..."
                  className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-moria-border text-sm hover:bg-moria-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-900/40 border border-red-800/40 text-red-400 text-sm font-medium hover:bg-red-900/60 transition-colors disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Bloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
