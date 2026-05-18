'use server'

import { revalidatePath } from 'next/cache'
import { updateTag } from 'next/cache'
import { z } from 'zod'
import { requireBarber } from './_guard'
import { barbersRepo } from '@/lib/repositories/barbers'
import type { ActionResult } from '@/types'

const profileSchema = z.object({
  full_name:       z.string().min(3).optional(),
  phone:           z.string().min(10).optional(),
  whatsapp:        z.string().min(10).optional(),
  bio:             z.string().max(500).optional(),
  instagram:       z.string().max(50).optional(),
  specialty:       z.array(z.string()).optional(),
  start_time:      z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time:        z.string().regex(/^\d{2}:\d{2}$/).optional(),
  works_monday:    z.boolean().optional(),
  works_tuesday:   z.boolean().optional(),
  works_wednesday: z.boolean().optional(),
  works_thursday:  z.boolean().optional(),
  works_friday:    z.boolean().optional(),
  works_saturday:  z.boolean().optional(),
  works_sunday:    z.boolean().optional(),
})

export async function updateBarberSelfProfile(
  input: z.infer<typeof profileSchema>
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireBarber()
    const { full_name, phone, whatsapp, ...barberFields } = profileSchema.parse(input)

    const barberUpdate = barbersRepo.update(supabase, userId, barberFields)
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
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
