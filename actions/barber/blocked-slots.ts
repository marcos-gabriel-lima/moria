'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireBarber } from './_guard'
import { blockedSlotsRepo } from '@/lib/repositories/blocked-slots'
import { DomainError, toActionError } from '@/lib/action-error'
import type { ActionResult, BlockedSlot } from '@/types'

const MAX_BLOCK_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

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

    const start = new Date(parsed.starts_at)
    const end   = new Date(parsed.ends_at)
    const now   = new Date()

    if (end <= start) {
      return { success: false, error: 'O horário de fim deve ser após o início' }
    }
    if (start < now) {
      return { success: false, error: 'Não é possível bloquear horários no passado' }
    }
    if (end.getTime() - start.getTime() > MAX_BLOCK_DURATION_MS) {
      return { success: false, error: 'Bloqueio não pode ultrapassar 30 dias' }
    }

    const { data, error } = await blockedSlotsRepo.create(supabase, {
      barber_id: userId,
      starts_at: parsed.starts_at,
      ends_at:   parsed.ends_at,
      reason:    parsed.reason ?? null,
    })

    if (error) {
      if (error.message?.includes('SLOT_CONFLICT')) {
        throw new DomainError('Já existe um agendamento neste horário')
      }
      throw error
    }

    revalidatePath('/barber/schedule')
    return { success: true, data: data as BlockedSlot }
  } catch (e) {
    return { success: false, error: toActionError(e) }
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
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
