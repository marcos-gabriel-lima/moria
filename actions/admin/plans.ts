'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { plansRepo } from '@/lib/repositories/plans'
import { toActionError } from '@/lib/action-error'
import type { ActionResult } from '@/types'

const planSchema = z.object({
  name:           z.string().min(3).max(60, 'Nome muito longo'),
  slug:           z.string().min(3).max(40)
                   .regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  description:    z.string().max(500, 'Descrição muito longa').optional(),
  price:          z.coerce.number().positive().max(9999.99, 'Preço muito alto'),
  includes_cut:   z.boolean().default(false),
  includes_beard: z.boolean().default(false),
  features:       z.array(z.string().max(80)).max(20, 'Máximo 20 features').default([]),
  display_order:  z.coerce.number().int().min(0).max(999).default(0),
})

type PlanInput = z.infer<typeof planSchema>

const partialPlanSchema = planSchema.partial()
const idSchema = z.string().uuid('ID inválido')

function revalidatePlans() {
  revalidatePath('/admin/plans')
  revalidatePath('/plans')
  updateTag('plans')
  updateTag('admin-plans')
}

export async function createPlan(formData: PlanInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin()
    const parsed = planSchema.safeParse(formData)
    if (!parsed.success) throw parsed.error
    const { data, error } = await plansRepo.create(supabase, parsed.data)
    if (error) throw error
    revalidatePlans()
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function updatePlan(
  id: string,
  formData: Partial<PlanInput>
): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    // ANTES: sem validação — atacante mandava { price: -999 } ou slug exótico.
    const parsed = partialPlanSchema.safeParse(formData)
    if (!parsed.success) throw parsed.error
    const { error } = await plansRepo.update(supabase, id, parsed.data)
    if (error) throw error
    revalidatePlans()
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function togglePlanActive(planId: string, isActive: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(planId).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    const { error } = await plansRepo.setActive(supabase, planId, isActive)
    if (error) throw error
    revalidatePlans()
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
