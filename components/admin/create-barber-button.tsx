'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createBarber } from '@/actions/admin'
import { cn } from '@/lib/utils'

const TIME_REGEX = /^([01]\d|2[0-3]):(00|30)$/

const schema = z.object({
  full_name:       z.string().min(3, 'Nome obrigatório').max(120),
  email:           z.string().email('E-mail inválido').max(254),
  phone:           z.string().min(10).max(20).optional().or(z.literal('')),
  whatsapp:        z.string().min(10).max(20).optional().or(z.literal('')),
  specialty:       z.string().max(200).optional(),
  bio:             z.string().max(500).optional(),
  instagram:       z.string().max(50).optional(),
  commission_rate: z.coerce.number().min(0).max(100).default(50),
  start_time:      z.string().regex(TIME_REGEX, 'Use HH:00 ou HH:30 (00–23h)').default('08:00'),
  end_time:        z.string().regex(TIME_REGEX, 'Use HH:00 ou HH:30 (00–23h)').default('18:00'),
  works_monday:    z.boolean().default(true),
  works_tuesday:   z.boolean().default(true),
  works_wednesday: z.boolean().default(true),
  works_thursday:  z.boolean().default(true),
  works_friday:    z.boolean().default(true),
  works_saturday:  z.boolean().default(true),
  works_sunday:    z.boolean().default(false),
}).refine(
  d => d.start_time < d.end_time,
  { message: 'Início deve ser antes do fim', path: ['end_time'] },
)

type FormData = z.infer<typeof schema>

const DAYS = [
  { key: 'works_monday'    as const, label: 'Seg' },
  { key: 'works_tuesday'   as const, label: 'Ter' },
  { key: 'works_wednesday' as const, label: 'Qua' },
  { key: 'works_thursday'  as const, label: 'Qui' },
  { key: 'works_friday'    as const, label: 'Sex' },
  { key: 'works_saturday'  as const, label: 'Sáb' },
  { key: 'works_sunday'    as const, label: 'Dom' },
]

export function CreateBarberButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      commission_rate: 50,
      start_time: '08:00',
      end_time: '18:00',
      works_monday: true, works_tuesday: true, works_wednesday: true,
      works_thursday: true, works_friday: true, works_saturday: true,
      works_sunday: false,
    },
  })

  const onSubmit = (data: FormData) => {
    setServerError('')
    startTransition(async () => {
      const result = await createBarber({
        ...data,
        specialty: data.specialty ? data.specialty.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      if (!result.success) { setServerError(result.error); return }
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  const Input = ({ name, label, type = 'text', placeholder }: {
    name: keyof FormData; label: string; type?: string; placeholder?: string
  }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40 placeholder:text-muted-foreground/40 transition-all"
      />
      {errors[name] && <p className="text-xs text-red-400">{errors[name]?.message as string}</p>}
    </div>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-gold-gradient text-black font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Novo Barbeiro
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-moria-surface border border-moria-border shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-moria-border">
              <h2 className="font-bold">Novo Barbeiro</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input name="full_name" label="Nome completo *" placeholder="João Silva" />
                <Input name="email" label="E-mail *" type="email" placeholder="joao@moria.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input name="phone" label="Telefone" placeholder="(11) 9 9999-9999" />
                <Input name="whatsapp" label="WhatsApp" placeholder="(11) 9 9999-9999" />
              </div>
              <Input name="specialty" label="Especialidades (separadas por vírgula)" placeholder="Degradê, Navalhado, Barba" />
              <Input name="instagram" label="Instagram" placeholder="@joaobarber" />
              <Input name="bio" label="Bio" placeholder="Apresentação breve..." />

              <div className="grid grid-cols-3 gap-3">
                <Input name="commission_rate" label="Comissão %" type="number" placeholder="50" />
                <Input name="start_time" label="Início" type="time" />
                <Input name="end_time" label="Fim" type="time" />
              </div>

              {/* Dias de trabalho */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Dias de trabalho</p>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(({ key, label }) => {
                    const checked = watch(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setValue(key, !checked)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          checked
                            ? 'bg-gold-DEFAULT/10 border-gold-DEFAULT/40 text-gold-DEFAULT'
                            : 'bg-moria-elevated border-moria-border text-muted-foreground hover:border-moria-border/80'
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {serverError && (
                <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Um e-mail de boas-vindas será enviado ao barbeiro com link para definir a senha (válido por 1 hora).
              </p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-moria-border text-sm">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {isPending ? 'Criando...' : 'Criar Barbeiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
