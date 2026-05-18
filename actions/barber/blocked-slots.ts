'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireBarber } from './_guard'
import { blockedSlotsRepo } from '@/lib/repositories/blocked-slots'
import type { ActionResult, BlockedSlot } from '@/types'

const createBlockSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at:   z.string().datetime(),
  reason:    z.string().max(100).optional(),
})

export async function createBlockedSlot(
  input: z.infer<typeof createBlockSchema>
): Promise<ActionResult<BlockedSlot>> {
  try {
    const { userId, supabase } = await requireBarber()

    const parsed = createBlockSchema.parse(input)

    if (parsed.ends_at <= parsed.starts_at) {
      return { success: false, error: 'O horário de fim deve ser após o início' }
    }

    const { data, error } = await blockedSlotsRepo.create(supabase, {
      barber_id: userId,
      starts_at: parsed.starts_at,
      ends_at:   parsed.ends_at,
      reason:    parsed.reason ?? null,
    })

    if (error) {
      if (error.message.includes('SLOT_CONFLICT')) {
        return { success: false, error: 'Já existe um agendamento neste horário' }
      }
      throw error
    }

    revalidatePath('/barber/schedule')
    return { success: true, data: data as BlockedSlot }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteBlockedSlot(slotId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(slotId).success) {
    return { success: false, error: 'ID inválido' }
  }

  try {
    const { userId, supabase } = await requireBarber()
    const { error } = await blockedSlotsRepo.delete(supabase, slotId, userId)
    if (error) throw error

    revalidatePath('/barber/schedule')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
