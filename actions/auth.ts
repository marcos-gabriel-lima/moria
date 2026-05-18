'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { z } from 'zod'

const signUpSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  whatsapp: z.string().min(10, 'WhatsApp inválido').optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export async function signUp(
  formData: z.infer<typeof signUpSchema>
): Promise<ActionResult<{ session: boolean }>> {
  const supabase = await createClient()

  const parsed = signUpSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { full_name, email, phone, whatsapp, password } = parsed.data

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone, whatsapp },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'Este e-mail já está cadastrado' }
    }
    return { success: false, error: 'Erro ao criar conta. Tente novamente.' }
  }

  return { success: true, data: { session: !!data.session } }
}

export async function signIn(
  formData: z.infer<typeof signInSchema>
): Promise<ActionResult<{ role: string }>> {
  const supabase = await createClient()

  const parsed = signInSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.message.includes('Invalid login')) {
      return { success: false, error: 'E-mail ou senha incorretos' }
    }
    return { success: false, error: 'Erro ao fazer login' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  revalidatePath('/', 'layout')
  return { success: true, data: { role: profile?.role ?? 'client' } }
}

export async function signInWithMagicLink(email: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { success: false, error: 'Erro ao enviar link mágico' }
  return { success: true, data: undefined }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

const updateProfileSchema = z.object({
  full_name:  z.string().min(3).optional(),
  phone:      z.string().min(10).optional(),
  whatsapp:   z.string().min(10).optional(),
  avatar_url: z.string().url().optional(),
})

export async function updateProfile(
  data: z.infer<typeof updateProfileSchema>
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  if (error) return { success: false, error: 'Erro ao atualizar perfil' }

  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}
