'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { updateBarber, toggleBarberActive } from '@/actions/admin'
import { ToggleSwitch } from './toggle-switch'
import { cn } from '@/lib/utils'
import type { Barber, Profile } from '@/types'

const schema = z.object({
  full_name: z.string().min(3),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  instagram: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100),
  start_time: z.string(),
  end_time: z.string(),
  works_monday: z.boolean(),
  works_tuesday: z.boolean(),
  works_wednesday: z.boolean(),
  works_thursday: z.boolean(),
  works_friday: z.boolean(),
  works_saturday: z.boolean(),
  works_sunday: z.boolean(),
})

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

interface EditBarberFormProps {
  barber: Barber & { profile: Profile }
}

export function EditBarberForm({ barber }: EditBarberFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name:        barber.profile.full_name,
      phone:            barber.profile.phone ?? '',
      whatsapp:         barber.profile.whatsapp ?? '',
      specialty:        barber.specialty?.join(', ') ?? '',
      bio:              barber.bio ?? '',
      instagram:        barber.instagram ?? '',
      commission_rate:  barber.commission_rate,
      start_time:       barber.start_time,
      end_time:         barber.end_time,
      works_monday:     barber.works_monday,
      works_tuesday:    barber.works_tuesday,
      works_wednesday:  barber.works_wednesday,
      works_thursday:   barber.works_thursday,
      works_friday:     barber.works_friday,
      works_saturday:   barber.works_saturday,
      works_sunday:     barber.works_sunday,
    },
  })

  const onSubmit = (data: FormData) => {
    setError('')
    setSaved(false)
    startTransition(async () => {
      const result = await updateBarber({
        id: barber.id,
        ...data,
        specialty: data.specialty ? data.specialty.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      if (!result.success) { setError(result.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-moria-elevated border border-moria-border text-sm focus:outline-none focus:ring-1 focus:ring-gold-DEFAULT/40 placeholder:text-muted-foreground/40 transition-all'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Status toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-moria-elevated border border-moria-border">
        <span className="text-sm">Barbeiro ativo</span>
        <ToggleSwitch
          checked={barber.is_active}
          onToggle={(v) => toggleBarberActive(barber.id, v).then(() => router.refresh())}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Nome</label>
        <input {...register('full_name')} className={inputCls} />
        {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Telefone</label>
          <input {...register('phone')} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
          <input {...register('whatsapp')} className={inputCls} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Especialidades (vírgula)</label>
        <input {...register('specialty')} className={inputCls} placeholder="Degradê, Navalhado..." />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Instagram</label>
        <input {...register('instagram')} className={inputCls} placeholder="@perfil" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Bio</label>
        <textarea {...register('bio')} rows={2} className={cn(inputCls, 'resize-none')} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Comissão %</label>
          <input {...register('commission_rate')} type="number" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Início</label>
          <input {...register('start_time')} type="time" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fim</label>
          <input {...register('end_time')} type="time" className={inputCls} />
        </div>
      </div>

      {/* Dias */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Dias de trabalho</label>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(({ key, label }) => {
            const checked = watch(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => setValue(key, !checked, { shouldDirty: true })}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  checked
                    ? 'bg-gold-DEFAULT/10 border-gold-DEFAULT/40 text-gold-DEFAULT'
                    : 'bg-moria-elevated border-moria-border text-muted-foreground'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gold-gradient text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
      >
        <Save className="w-4 h-4" />
        {isPending ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar Alterações'}
      </button>
    </form>
  )
}
