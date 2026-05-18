'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { plansRepo } from '@/lib/repositories/plans'
import type { ActionResult } from '@/types'

const planSchema = z.object({
  name:          z.string().min(3),
  slug:          z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  description:   z.string().optional(),
  price:         z.coerce.number().positive(),
  includes_cut:  z.boolean().default(false),
  includes_beard: z.boolean().default(false),
  features:      z.array(z.string()).default([]),
  display_order: z.coerce.number().default(0),
})

type PlanInput = z.infer<typeof planSchema>

function revalidatePlans() {
  revalidatePath('/admin/plans')
  revalidatePath('/plans')
  updateTag('plans')
  updateTag('admin-plans')
}

export async function createPlan(formData: PlanInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin()
    const parsed = planSchema.parse(formData)
    const { data, error } = await plansRepo.create(supabase, parsed)
    if (error) throw error
    revalidatePlans()
    return { success: true, data: { id: data.id } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updatePlan(
  id: string,
  formData: Partial<PlanInput>
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await plansRepo.update(supabase, id, formData)
    if (error) throw error
    revalidatePlans()
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function togglePlanActive(planId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await plansRepo.setActive(supabase, planId, isActive)
    if (error) throw error
    revalidatePlans()
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
