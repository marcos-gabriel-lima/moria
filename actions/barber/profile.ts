'use server'

import { revalidatePath } from 'next/cache'
import { updateTag } from 'next/cache'
import { z } from 'zod'
import { requireBarber } from './_guard'
import { barbersRepo } from '@/lib/repositories/barbers'
import { toActionError } from '@/lib/action-error'
import type { ActionResult } from '@/types'

// HH:mm entre 00:00 e 23:30 (slots de 30min — 23:30 é o último início possível).
const TIME_REGEX = /^([01]\d|2[0-3]):(00|30)$/

const profileSchema = z.object({
  full_name:       z.string().min(3).max(120).optional(),
  phone:           z.string().min(10).max(20).optional(),
  whatsapp:        z.string().min(10).max(20).optional(),
  bio:             z.string().max(500).optional(),
  instagram:       z.string().max(50).optional(),
  specialty:       z.array(z.string().max(40)).max(10).optional(),
  start_time:      z.string().regex(TIME_REGEX, 'Horário inválido (use HH:00 ou HH:30, 00–23h)').optional(),
  end_time:        z.string().regex(TIME_REGEX, 'Horário inválido (use HH:00 ou HH:30, 00–23h)').optional(),
  works_monday:    z.boolean().optional(),
  works_tuesday:   z.boolean().optional(),
  works_wednesday: z.boolean().optional(),
  works_thursday:  z.boolean().optional(),
  works_friday:    z.boolean().optional(),
  works_saturday:  z.boolean().optional(),
  works_sunday:    z.boolean().optional(),
}).refine(
  d => !d.start_time || !d.end_time || d.start_time < d.end_time,
  { message: 'Início do expediente deve ser antes do fim', path: ['end_time'] },
)

export async function updateBarberSelfProfile(
  input: z.infer<typeof profileSchema>
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireBarber()

    const parsed = profileSchema.safeParse(input)
    if (!parsed.success) throw parsed.error
    const { full_name, phone, whatsapp, ...barberFields } = parsed.data

    // Só faz UPDATE em `barbers` se houver campo pra mudar.
    const hasBarberFields = Object.values(barberFields).some(v => v !== undefined)

    const barberUpdate = hasBarberFields
      ? barbersRepo.update(supabase, userId, barberFields)
      : Promise.resolve({ error: null })

    const profileUpdate = (full_name || phone || whatsapp)
      ? supabase.from('profiles').update({
          ...(full_name && { full_name }),
          ...(phone     && { phone     }),
          ...(whatsapp  && { whatsapp  }),
        }).eq('id', userId)
      : Promise.resolve({ error: null })

    const [barberResult, profileResult] = await Promise.all([barberUpdate, profileUpdate])
    if (barberResult.error)  throw barberResult.error
    if (profileResult.error) throw profileResult.error

    revalidatePath('/barber/profile')
    revalidatePath('/barber/schedule')
    updateTag('admin-barbers')
    updateTag('barbers')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
