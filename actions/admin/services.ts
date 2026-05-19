'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { servicesRepo } from '@/lib/repositories/services'
import type { ActionResult } from '@/types'

const serviceSchema = z.object({
  name:             z.string().min(2),
  description:      z.string().optional(),
  category:         z.enum(['haircut', 'beard', 'combo', 'treatment', 'other']),
  duration_minutes: z.coerce.number().min(15).max(180),
  price:            z.coerce.number().positive(),
  covered_by_cut:   z.boolean().default(false),
  covered_by_beard: z.boolean().default(false),
  display_order:    z.coerce.number().default(0),
})

function revalidateServices() {
  revalidatePath('/admin/plans')
  updateTag('services')
  updateTag('admin-plans')
}

const idSchema = z.string().uuid('ID inválido')

export async function upsertService(
  formData: z.infer<typeof serviceSchema> & { id?: string }
): Promise<ActionResult> {
  const { id, ...data } = formData
  if (id && !idSchema.safeParse(id).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    const parsed = serviceSchema.parse(data)

    const { error } = id
      ? await servicesRepo.update(supabase, id, parsed)
      : await servicesRepo.create(supabase, parsed)

    if (error) throw error
    revalidateServices()
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleServiceActive(serviceId: string, isActive: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(serviceId).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    const { error } = await servicesRepo.setActive(supabase, serviceId, isActive)
    if (error) throw error
    revalidateServices()
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
