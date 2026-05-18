'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { productsRepo } from '@/lib/repositories/products'
import { createAdminClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

const productSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  price:       z.coerce.number().positive(),
})

function revalidateProducts() {
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
  updateTag('products')
  updateTag('admin-products')
}

async function uploadImage(adminCli: Awaited<ReturnType<typeof createAdminClient>>, file: File) {
  const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())

  const { error } = await adminCli.storage
    .from('product-images')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Erro ao fazer upload da imagem: ${error.message}`)

  const { data } = adminCli.storage.from('product-images').getPublicUrl(filename)
  return data.publicUrl
}

export async function createProduct(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin()

    const name        = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim() || undefined
    const price       = parseFloat(formData.get('price') as string)
    const imageFile   = formData.get('image') as File | null

    productSchema.parse({ name, description, price })

    let image_url: string | null = null
    if (imageFile && imageFile.size > 0) {
      const adminCli = await createAdminClient()
      image_url = await uploadImage(adminCli, imageFile)
    }

    const { data, error } = await productsRepo.create(supabase, {
      name,
      description: description ?? null,
      price,
      stock: 0,
      image_url,
    })
    if (error) throw error

    revalidateProducts()
    return { success: true, data: { id: data.id } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ image_url: string }>> {
  try {
    const { supabase } = await requireAdmin()
    const imageFile = formData.get('image') as File | null

    if (!imageFile || imageFile.size === 0) {
      return { success: false, error: 'Nenhum arquivo selecionado' }
    }

    const adminCli = await createAdminClient()
    const image_url = await uploadImage(adminCli, imageFile)

    const { error } = await productsRepo.update(supabase, productId, { image_url })
    if (error) throw error

    revalidateProducts()
    return { success: true, data: { image_url } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateProduct(
  id: string,
  formData: { name: string; description?: string; price: number }
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const parsed = productSchema.parse(formData)
    const { error } = await productsRepo.update(supabase, id, {
      name:        parsed.name,
      description: parsed.description ?? null,
      price:       parsed.price,
    })
    if (error) throw error
    revalidateProducts()
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleProductActive(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await productsRepo.setActive(supabase, productId, isActive)
    if (error) throw error
    revalidateProducts()
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function adjustStock(productId: string, delta: number): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await productsRepo.adjustStock(supabase, productId, delta)
    if (error) throw error
    revalidatePath('/admin/products')
    updateTag('products')
    updateTag('admin-products')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
