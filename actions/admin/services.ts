'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { servicesRepo } from '@/lib/repositories/services'
import { toActionError } from '@/lib/action-error'
import type { ActionResult } from '@/types'

const serviceSchema = z.object({
  name:             z.string().min(2).max(80, 'Nome muito longo'),
  description:      z.string().max(500, 'Descrição muito longa').optional(),
  category:         z.enum(['haircut', 'beard', 'combo', 'treatment', 'other']),
  duration_minutes: z.coerce.number().int().min(15).max(180),
  price:            z.coerce.number().positive().max(9999.99, 'Preço muito alto'),
  covered_by_cut:   z.boolean().default(false),
  covered_by_beard: z.boolean().default(false),
  display_order:    z.coerce.number().int().min(0).max(999).default(0),
})

const idSchema = z.string().uuid('ID inválido')

function revalidateServices() {
  revalidatePath('/admin/plans')
  updateTag('services')
  updateTag('admin-plans')
}

export async function upsertService(
  formData: z.infer<typeof serviceSchema> & { id?: string }
): Promise<ActionResult> {
  const { id, ...data } = formData
  if (id && !idSchema.safeParse(id).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    const parsed = serviceSchema.safeParse(data)
    if (!parsed.success) throw parsed.error

    const { error } = id
      ? await servicesRepo.update(supabase, id, parsed.data)
      : await servicesRepo.create(supabase, parsed.data)

    if (error) throw error
    revalidateServices()
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
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
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
