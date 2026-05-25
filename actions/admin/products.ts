'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { productsRepo } from '@/lib/repositories/products'
import { createAdminClient } from '@/lib/supabase/server'
import { DomainError, toActionError } from '@/lib/action-error'
import {
  detectImageMimeType,
  validateImageSize,
  imageRejectionMessage,
  IMAGE_EXTENSIONS,
} from '@/lib/image-upload'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import type { ActionResult } from '@/types'

const productSchema = z.object({
  name:        z.string().min(2).max(120, 'Nome muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  price:       z.coerce.number().positive().max(99_999.99, 'Preço muito alto'),
})

const idSchema = z.string().uuid('ID inválido')

function revalidateProducts() {
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
  updateTag('products')
  updateTag('admin-products')
}

async function uploadImage(adminCli: Awaited<ReturnType<typeof createAdminClient>>, file: File) {
  // Check de tamanho ANTES de carregar bytes em memória — defesa contra OOM.
  const sizeError = validateImageSize(file)
  if (sizeError) throw new DomainError(imageRejectionMessage(sizeError))

  const buffer = Buffer.from(await file.arrayBuffer())

  const mimeType = detectImageMimeType(buffer)
  if (!mimeType) throw new DomainError(imageRejectionMessage('unsupported_format'))

  const filename = `${crypto.randomUUID()}.${IMAGE_EXTENSIONS[mimeType]}`

  const { error } = await adminCli.storage
    .from('product-images')
    .upload(filename, buffer, { contentType: mimeType, upsert: false })

  // Não anexa error.message (pode vazar config do storage).
  if (error) throw new DomainError('Erro ao fazer upload da imagem. Tente novamente.')

  const { data } = adminCli.storage.from('product-images').getPublicUrl(filename)
  return data.publicUrl
}

export async function createProduct(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, supabase } = await requireAdmin()

    const rl = await checkRateLimit('adminProductUpload', userId, RATE_LIMITS.adminAction)
    if (!rl.success) throw new DomainError('Muitas ações seguidas. Aguarde 1 minuto.')

    const name        = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim() || undefined
    const price       = parseFloat(formData.get('price') as string)
    const imageFile   = formData.get('image') as File | null

    const parsed = productSchema.safeParse({ name, description, price })
    if (!parsed.success) throw parsed.error

    let image_url: string | null = null
    if (imageFile && imageFile.size > 0) {
      const adminCli = await createAdminClient()
      image_url = await uploadImage(adminCli, imageFile)
    }

    const { data, error } = await productsRepo.create(supabase, {
      name:        parsed.data.name,
      description: parsed.data.description ?? null,
      price:       parsed.data.price,
      stock: 0,
      image_url,
    })
    if (error) throw error

    revalidateProducts()
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ image_url: string }>> {
  if (!idSchema.safeParse(productId).success) return { success: false, error: 'ID inválido' }
  try {
    const { userId, supabase } = await requireAdmin()

    const rl = await checkRateLimit('adminProductUpload', userId, RATE_LIMITS.adminAction)
    if (!rl.success) throw new DomainError('Muitas ações seguidas. Aguarde 1 minuto.')

    const imageFile = formData.get('image') as File | null
    if (!imageFile || imageFile.size === 0) {
      throw new DomainError('Nenhum arquivo selecionado')
    }

    const adminCli = await createAdminClient()
    const image_url = await uploadImage(adminCli, imageFile)

    const { error } = await productsRepo.update(supabase, productId, { image_url })
    if (error) throw error

    revalidateProducts()
    return { success: true, data: { image_url } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function updateProduct(
  id: string,
  formData: { name: string; description?: string; price: number }
): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    const parsed = productSchema.safeParse(formData)
    if (!parsed.success) throw parsed.error
    const { error } = await productsRepo.update(supabase, id, {
      name:        parsed.data.name,
      description: parsed.data.description ?? null,
      price:       parsed.data.price,
    })
    if (error) throw error
    revalidateProducts()
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function toggleProductActive(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!idSchema.safeParse(productId).success) return { success: false, error: 'ID inválido' }
  try {
    const { supabase } = await requireAdmin()
    const { error } = await productsRepo.setActive(supabase, productId, isActive)
    if (error) throw error
    revalidateProducts()
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function adjustStock(productId: string, delta: number): Promise<ActionResult> {
  if (!idSchema.safeParse(productId).success) return { success: false, error: 'ID inválido' }
  if (!z.number().int().min(-999).max(999).safeParse(delta).success) {
    return { success: false, error: 'Ajuste de estoque inválido' }
  }
  try {
    const { supabase } = await requireAdmin()
    const { error } = await productsRepo.adjustStock(supabase, productId, delta)
    if (error) throw error
    revalidatePath('/admin/products')
    updateTag('products')
    updateTag('admin-products')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
