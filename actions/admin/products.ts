'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './_guard'
import { productsRepo } from '@/lib/repositories/products'
import type { ActionResult } from '@/types'

const productSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  price:       z.coerce.number().positive(),
  stock:       z.coerce.number().int().min(0).default(0),
  category:    z.string().optional(),
  image_url:   z.string().url().optional().or(z.literal('')),
})

type ProductInput = z.infer<typeof productSchema>

function revalidateProducts() {
  revalidatePath('/admin/products')
  revalidatePath('/products')
  updateTag('products')
  updateTag('admin-products')
}

export async function createProduct(formData: ProductInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin()
    const parsed = productSchema.parse(formData)
    const { data, error } = await productsRepo.create(supabase, {
      ...parsed,
      image_url: parsed.image_url || null,
    })
    if (error) throw error
    revalidateProducts()
    return { success: true, data: { id: data.id } }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateProduct(
  id: string,
  formData: Partial<ProductInput>
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await productsRepo.update(supabase, id, {
      ...formData,
      image_url: formData.image_url || null,
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
