'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { barbersRepo } from '@/lib/repositories/barbers'
import { createAdminClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

const barberSchema = z.object({
  full_name:       z.string().min(3),
  email:           z.string().email(),
  phone:           z.string().optional(),
  whatsapp:        z.string().optional(),
  specialty:       z.array(z.string()).default([]),
  bio:             z.string().optional(),
  instagram:       z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).default(50),
  works_monday:    z.boolean().default(true),
  works_tuesday:   z.boolean().default(true),
  works_wednesday: z.boolean().default(true),
  works_thursday:  z.boolean().default(true),
  works_friday:    z.boolean().default(true),
  works_saturday:  z.boolean().default(true),
  works_sunday:    z.boolean().default(false),
  start_time:      z.string().default('08:00'),
  end_time:        z.string().default('18:00'),
})

const updateBarberSchema = barberSchema.omit({ email: true, full_name: true }).extend({
  id:        z.string().uuid(),
  full_name: z.string().min(3).optional(),
})

function revalidateBarbers(id?: string) {
  revalidatePath('/admin/barbers')
  updateTag('barbers')
  updateTag('admin-barbers')
  if (id) revalidatePath(`/admin/barbers/${id}`)
}

export async function createBarber(
  formData: z.infer<typeof barberSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()
    const parsed = barberSchema.parse(formData)
    const adminClient = await createAdminClient()
    const tempPassword = crypto.randomUUID().replace(/-/g, '') + 'A1!'

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: parsed.full_name, phone: parsed.phone, whatsapp: parsed.whatsapp },
    })
    if (authError) throw authError

    const userId = authData.user.id

    const [profileUpdate, barberInsert] = await Promise.all([
      adminClient.from('profiles').update({
        role: 'barber',
        phone: parsed.phone ?? null,
        whatsapp: parsed.whatsapp ?? null,
      }).eq('id', userId),

      barbersRepo.create(adminClient, {
        id: userId,
        specialty:       parsed.specialty,
        bio:             parsed.bio ?? null,
        instagram:       parsed.instagram ?? null,
        commission_rate: parsed.commission_rate,
        works_monday:    parsed.works_monday,
        works_tuesday:   parsed.works_tuesday,
        works_wednesday: parsed.works_wednesday,
        works_thursday:  parsed.works_thursday,
        works_friday:    parsed.works_friday,
        works_saturday:  parsed.works_saturday,
        works_sunday:    parsed.works_sunday,
        start_time:      parsed.start_time,
        end_time:        parsed.end_time,
      }),
    ])

    if (profileUpdate.error) throw profileUpdate.error
    if (barberInsert.error) throw barberInsert.error

    revalidateBarbers(userId)
    return { success: true, data: { id: userId } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateBarber(
  formData: z.infer<typeof updateBarberSchema>
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { id, full_name, ...rest } = formData

    const barberUpdate = barbersRepo.update(supabase, id, {
      specialty:       rest.specialty,
      bio:             rest.bio ?? null,
      instagram:       rest.instagram ?? null,
      commission_rate: rest.commission_rate,
      works_monday:    rest.works_monday,
      works_tuesday:   rest.works_tuesday,
      works_wednesday: rest.works_wednesday,
      works_thursday:  rest.works_thursday,
      works_friday:    rest.works_friday,
      works_saturday:  rest.works_saturday,
      works_sunday:    rest.works_sunday,
      start_time:      rest.start_time,
      end_time:        rest.end_time,
    })
    const profileUpdate = full_name
      ? supabase.from('profiles').update({ full_name }).eq('id', id)
      : Promise.resolve({ error: null })

    const [barberResult, profileResult] = await Promise.all([barberUpdate, profileUpdate])
    if (barberResult.error) throw barberResult.error
    if (profileResult.error) throw profileResult.error

    revalidateBarbers(id)
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleBarberActive(barberId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await barbersRepo.setActive(supabase, barberId, isActive)
    if (error) throw error
    revalidateBarbers(barberId)
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateBarberCommission(barberId: string, rate: number): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await barbersRepo.setCommission(supabase, barberId, rate)
    if (error) throw error
    revalidatePath(`/admin/barbers/${barberId}`)
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
