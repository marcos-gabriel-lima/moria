'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, UserX, UserCheck, FileText, Crown, X } from 'lucide-react'
import { toggleClientActive, updateClientNotes, cancelClientSubscription, grantManualSubscription } from '@/actions/admin'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

interface ClientDetailActionsProps {
  clientId: string
  isActive: boolean
  notes: string
  activeSubscriptionId?: string
  plans: Pick<Plan, 'id' | 'name' | 'price'>[]
}

export function ClientDetailActions({
  clientId,
  isActive,
  notes,
  activeSubscriptionId,
  plans,
}: ClientDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState<'menu' | 'notes' | 'grant' | null>(null)
  const [notesValue, setNotesValue] = useState(notes)
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id ?? '')
  const [error, setError] = useState('')

  // Recebe uma server action que retorna ActionResult.
  // Antes, recebia uma Promise<void> e usava `.then(() => refresh())` — isso
  // IGNORAVA o `result.success` e o modal fechava mesmo em caso de erro,
  // dando silent failure (admin pensava que salvou, action rejeitou).
  type ActionLike = { success: boolean; error?: string } | { success: true; data?: unknown } | void
  // Recebe uma server action que retorna ActionResult (ou void quando redirect).
  // Antes, recebia `.then(() => refresh())` e IGNORAVA o `result.success` —
  // silent failure: modal fechava mesmo se action rejeitasse.
  const run = (fn: () => Promise<ActionLike>) => {
    setError('')
    startTransition(async () => {
      try {
        const result = await fn()
        if (result && 'success' in result && !result.success) {
          setError(('error' in result && result.error) || 'Erro inesperado')
          return
        }
        router.refresh()
        setOpen(null)
      } catch {
        setError('Erro inesperado. Tente novamente.')
      }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(open === 'menu' ? null : 'menu')}
        className="p-2 rounded-lg border border-moria-border hover:bg-moria-elevated transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open === 'menu' && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(null)} />
          <div className="absolute right-0 top-10 z-50 w-52 rounded-xl bg-moria-surface border border-moria-border shadow-2xl overflow-hidden">
            <div className="p-1 space-y-0.5">
              <button
                onClick={() => setOpen('notes')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-moria-elevated transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                Editar notas internas
              </button>

              {!activeSubscriptionId && (
                <button
                  onClick={() => setOpen('grant')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-moria-elevated transition-colors text-left"
                >
                  <Crown className="w-4 h-4 text-gold-DEFAULT" />
                  Conceder assinatura
                </button>
              )}

              {activeSubscriptionId && (
                <button
                  onClick={() => run(() => cancelClientSubscription(activeSubscriptionId, 'Cancelado pelo admin'))}
                  disabled={isPending}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-red-950/20 text-red-400 transition-colors text-left"
                >
                  <X className="w-4 h-4" />
                  Cancelar assinatura
                </button>
              )}

              <div className="border-t border-moria-border my-1" />

              <button
                onClick={() => run(() => toggleClientActive(clientId, !isActive))}
                disabled={isPending}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  isActive
                    ? 'hover:bg-red-950/20 text-red-400'
                    : 'hover:bg-green-950/20 text-green-400'
                )}
              >
                {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                {isActive ? 'Desativar cliente' : 'Reativar cliente'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal: Notas */}
      {open === 'notes' && (
        <Modal title="Notas Internas" onClose={() => setOpen(null)}>
          <textarea
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
            rows={4}
            placeholder="Observações internas sobre o cliente..."
            className="w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setOpen(null)} className="flex-1 py-2 rounded-lg border border-moria-border text-sm">Cancelar</button>
            <button
              onClick={() => run(() => updateClientNotes(clientId, notesValue))}
              disabled={isPending || notesValue.length > 1000}
              className="flex-1 py-2 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Conceder assinatura */}
      {open === 'grant' && (
        <Modal title="Conceder Assinatura" onClose={() => setOpen(null)}>
          <p className="text-sm text-muted-foreground">Conceder acesso manual sem pagamento online.</p>
          <div className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plano</label>
              <select
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setOpen(null)} className="flex-1 py-2 rounded-lg border border-moria-border text-sm">Cancelar</button>
            <button
              onClick={() => run(() => grantManualSubscription(clientId, selectedPlan, { unit: 'months', value: 1 }))}
              disabled={isPending || !selectedPlan}
              className="flex-1 py-2 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Concedendo...' : 'Conceder 1 mês'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-moria-surface border border-moria-border p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
