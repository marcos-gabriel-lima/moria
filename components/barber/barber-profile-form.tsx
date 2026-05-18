'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { updateBarberSelfProfile } from '@/actions/barber'
import type { Barber, Profile } from '@/types'

const DAYS = [
  { key: 'works_monday',    label: 'Seg' },
  { key: 'works_tuesday',   label: 'Ter' },
  { key: 'works_wednesday', label: 'Qua' },
  { key: 'works_thursday',  label: 'Qui' },
  { key: 'works_friday',    label: 'Sex' },
  { key: 'works_saturday',  label: 'Sáb' },
  { key: 'works_sunday',    label: 'Dom' },
] as const

interface BarberProfileFormProps {
  profile: Profile
  barber: Barber
}

export function BarberProfileForm({ profile, barber }: BarberProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [workDays, setWorkDays] = useState({
    works_monday:    barber.works_monday,
    works_tuesday:   barber.works_tuesday,
    works_wednesday: barber.works_wednesday,
    works_thursday:  barber.works_thursday,
    works_friday:    barber.works_friday,
    works_saturday:  barber.works_saturday,
    works_sunday:    barber.works_sunday,
  })

  const [specialty, setSpecialty] = useState<string[]>(barber.specialty ?? [])
  const [specialtyInput, setSpecialtyInput] = useState('')

  const addSpecialty = () => {
    const v = specialtyInput.trim()
    if (v && !specialty.includes(v) && specialty.length < 8) {
      setSpecialty([...specialty, v])
      setSpecialtyInput('')
    }
  }

  const removeSpecialty = (s: string) => setSpecialty(specialty.filter(x => x !== s))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    const form = e.currentTarget
    const fd = new FormData(form)

    const input = {
      full_name:   (fd.get('full_name') as string) || undefined,
      phone:       (fd.get('phone') as string) || undefined,
      whatsapp:    (fd.get('whatsapp') as string) || undefined,
      bio:         (fd.get('bio') as string) || undefined,
      instagram:   (fd.get('instagram') as string) || undefined,
      start_time:  (fd.get('start_time') as string) || undefined,
      end_time:    (fd.get('end_time') as string) || undefined,
      specialty:   specialty.length ? specialty : undefined,
      ...workDays,
    }

    startTransition(async () => {
      const result = await updateBarberSelfProfile(input)
      setMessage(result.success
        ? { type: 'success', text: 'Perfil atualizado com sucesso!' }
        : { type: 'error',   text: result.error }
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados pessoais */}
      <section className="rounded-xl border border-moria-border bg-moria-surface p-5 space-y-4">
        <h2 className="font-bold text-sm">Dados Pessoais</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nome completo</label>
            <input
              name="full_name"
              defaultValue={profile.full_name}
              className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Telefone</label>
              <input
                name="phone"
                defaultValue={profile.phone ?? ''}
                className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">WhatsApp</label>
              <input
                name="whatsapp"
                defaultValue={profile.whatsapp ?? ''}
                className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Perfil profissional */}
      <section className="rounded-xl border border-moria-border bg-moria-surface p-5 space-y-4">
        <h2 className="font-bold text-sm">Perfil Profissional</h2>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Bio (máx. 500 caracteres)</label>
          <textarea
            name="bio"
            defaultValue={barber.bio ?? ''}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Instagram (sem @)</label>
          <input
            name="instagram"
            defaultValue={barber.instagram ?? ''}
            maxLength={50}
            placeholder="seuperfil"
            className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Especialidades</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {specialty.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => removeSpecialty(s)}
                className="px-2.5 py-1 text-xs rounded-full bg-gold-DEFAULT/15 border border-gold-DEFAULT/40 text-gold-DEFAULT hover:bg-red-900/20 hover:border-red-800/40 hover:text-red-400 transition-colors"
              >
                {s} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={specialtyInput}
              onChange={e => setSpecialtyInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty() } }}
              placeholder="Ex: Degradê, Barba..."
              className="flex-1 rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
            />
            <button
              type="button"
              onClick={addSpecialty}
              className="px-3 py-2 text-xs rounded-lg border border-moria-border hover:border-gold-DEFAULT/40 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      </section>

      {/* Horários */}
      <section className="rounded-xl border border-moria-border bg-moria-surface p-5 space-y-4">
        <h2 className="font-bold text-sm">Horários de Trabalho</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Início</label>
            <input
              type="time"
              name="start_time"
              defaultValue={barber.start_time}
              className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Término</label>
            <input
              type="time"
              name="end_time"
              defaultValue={barber.end_time}
              className="w-full rounded-lg border border-moria-border bg-moria-elevated px-3 py-2 text-sm focus:outline-none focus:border-gold-DEFAULT/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">Dias que trabalha</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setWorkDays(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`w-10 h-10 rounded-full text-xs font-bold border transition-colors ${
                  workDays[key]
                    ? 'bg-gold-DEFAULT text-moria-black border-gold-DEFAULT'
                    : 'border-moria-border text-muted-foreground hover:border-gold-DEFAULT/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {message && (
        <p className={`text-sm text-center font-medium ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-DEFAULT text-moria-black font-bold text-sm hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isPending ? 'Salvando...' : 'Salvar Perfil'}
      </button>
    </form>
  )
}
