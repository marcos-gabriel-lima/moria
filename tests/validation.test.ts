import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recriamos os schemas idênticos aos das actions pra testar a validação isolada,
// sem precisar mockar createClient/Supabase.

const signUpSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(120, 'Nome muito longo'),
  email: z.string().email('E-mail inválido').max(254, 'E-mail muito longo'),
  phone: z.string().min(10, 'Telefone inválido').max(20, 'Telefone muito longo').optional(),
  whatsapp: z.string().min(10, 'WhatsApp inválido').max(20, 'WhatsApp muito longo').optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').max(128, 'Senha muito longa'),
})

const signInSchema = z.object({
  email: z.string().email('E-mail inválido').max(254, 'E-mail muito longo'),
  password: z.string().min(1, 'Senha obrigatória').max(128, 'Senha muito longa'),
})

const setPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').max(128, 'Senha muito longa'),
})

const createAppointmentSchema = z.object({
  barber_id: z.string().uuid(),
  service_ids: z.array(z.string().uuid()).min(1, 'Selecione ao menos 1 serviço').max(10, 'Máximo de 10 serviços por agendamento'),
  scheduled_at: z.string().datetime().refine(
    s => new Date(s).getTime() > Date.now(),
    'Não é possível agendar horários no passado'
  ),
  notes: z.string().max(500).optional(),
})

const UUID = '11111111-1111-1111-1111-111111111111'

describe('signUpSchema — Cadastro', () => {
  const valid = {
    full_name: 'João da Silva',
    email: 'joao@exemplo.com',
    password: 'senha123',
  }

  it('aceita cadastro mínimo válido', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true)
  })

  it('aceita cadastro com phone e whatsapp', () => {
    const result = signUpSchema.safeParse({
      ...valid,
      phone: '11999998888',
      whatsapp: '11999998888',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome com menos de 3 caracteres', () => {
    const result = signUpSchema.safeParse({ ...valid, full_name: 'Jo' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('3 caracteres')
    }
  })

  it('rejeita e-mail inválido (sem @)', () => {
    const result = signUpSchema.safeParse({ ...valid, email: 'joaoexemplo.com' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha com menos de 6 caracteres', () => {
    const result = signUpSchema.safeParse({ ...valid, password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('6 caracteres')
    }
  })

  it('rejeita nome com mais de 120 caracteres', () => {
    const result = signUpSchema.safeParse({ ...valid, full_name: 'A'.repeat(121) })
    expect(result.success).toBe(false)
  })

  it('rejeita senha com mais de 128 caracteres (proteção DoS bcrypt)', () => {
    const result = signUpSchema.safeParse({ ...valid, password: 'a'.repeat(129) })
    expect(result.success).toBe(false)
  })

  it('rejeita telefone curto demais', () => {
    const result = signUpSchema.safeParse({ ...valid, phone: '12345' })
    expect(result.success).toBe(false)
  })
})

describe('signInSchema — Login', () => {
  it('aceita e-mail e senha válidos', () => {
    const result = signInSchema.safeParse({ email: 'a@b.com', password: 'x' })
    expect(result.success).toBe(true)
  })

  it('rejeita login sem senha', () => {
    const result = signInSchema.safeParse({ email: 'a@b.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita e-mail mal formado', () => {
    const result = signInSchema.safeParse({ email: 'isso-nao-e-email', password: 'x' })
    expect(result.success).toBe(false)
  })
})

describe('setPasswordSchema — Definir senha (fluxo barber welcome)', () => {
  it('aceita senha válida (6 chars)', () => {
    expect(setPasswordSchema.safeParse({ password: '123456' }).success).toBe(true)
  })

  it('aceita senha longa (128 chars)', () => {
    expect(setPasswordSchema.safeParse({ password: 'a'.repeat(128) }).success).toBe(true)
  })

  it('rejeita senha curta (< 6 chars)', () => {
    const result = setPasswordSchema.safeParse({ password: '12345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('6 caracteres')
    }
  })

  it('rejeita senha vazia', () => {
    expect(setPasswordSchema.safeParse({ password: '' }).success).toBe(false)
  })

  it('🛡️ rejeita senha com mais de 128 chars (proteção DoS bcrypt)', () => {
    const result = setPasswordSchema.safeParse({ password: 'a'.repeat(129) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('muito longa')
    }
  })

  it('rejeita tipos não-string', () => {
    expect(setPasswordSchema.safeParse({ password: 123456 }).success).toBe(false)
    expect(setPasswordSchema.safeParse({ password: null }).success).toBe(false)
    expect(setPasswordSchema.safeParse({}).success).toBe(false)
  })
})

describe('createAppointmentSchema — Agendamento', () => {
  const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  it('aceita agendamento mínimo válido', () => {
    const result = createAppointmentSchema.safeParse({
      barber_id: UUID,
      service_ids: [UUID],
      scheduled_at: futuro,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita barber_id que não é UUID', () => {
    const result = createAppointmentSchema.safeParse({
      barber_id: 'isso-nao-e-uuid',
      service_ids: [UUID],
      scheduled_at: futuro,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita lista vazia de serviços', () => {
    const result = createAppointmentSchema.safeParse({
      barber_id: UUID,
      service_ids: [],
      scheduled_at: futuro,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('1 serviço')
    }
  })

  it('rejeita mais de 10 serviços', () => {
    const result = createAppointmentSchema.safeParse({
      barber_id: UUID,
      service_ids: Array(11).fill(UUID),
      scheduled_at: futuro,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Máximo de 10')
    }
  })

  it('rejeita agendamento no passado', () => {
    const passado = new Date(Date.now() - 60_000).toISOString()
    const result = createAppointmentSchema.safeParse({
      barber_id: UUID,
      service_ids: [UUID],
      scheduled_at: passado,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('passado')
    }
  })

  it('rejeita observação com mais de 500 caracteres', () => {
    const result = createAppointmentSchema.safeParse({
      barber_id: UUID,
      service_ids: [UUID],
      scheduled_at: futuro,
      notes: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('aceita observação dentro do limite', () => {
    const result = createAppointmentSchema.safeParse({
      barber_id: UUID,
      service_ids: [UUID],
      scheduled_at: futuro,
      notes: 'Cliente prefere corte degradê',
    })
    expect(result.success).toBe(true)
  })
})
