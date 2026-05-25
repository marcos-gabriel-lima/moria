import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  toActionError,
  UnauthenticatedError,
  ForbiddenError,
  DomainError,
} from '@/lib/action-error'

describe('toActionError — erros tipados de auth', () => {
  it('UnauthenticatedError preserva mensagem', () => {
    expect(toActionError(new UnauthenticatedError())).toBe('Não autenticado')
  })

  it('UnauthenticatedError customizada preserva mensagem custom', () => {
    expect(toActionError(new UnauthenticatedError('Sessão expirada'))).toBe('Sessão expirada')
  })

  it('ForbiddenError preserva mensagem', () => {
    expect(toActionError(new ForbiddenError())).toBe('Sem permissão')
  })

  it('DomainError preserva mensagem amigável', () => {
    expect(toActionError(new DomainError('Horário já reservado'))).toBe('Horário já reservado')
  })
})

describe('toActionError — ZodError', () => {
  it('extrai primeira mensagem amigável', () => {
    const schema = z.object({
      email: z.string().email('E-mail inválido'),
      password: z.string().min(8, 'Senha curta'),
    })
    const result = schema.safeParse({ email: 'foo', password: '123' })
    if (result.success) throw new Error('teste mal montado')
    expect(toActionError(result.error)).toBe('E-mail inválido')
  })

  it('🛡️ NÃO expõe o caminho do campo (proteção contra schema discovery)', () => {
    const schema = z.object({
      profile: z.object({
        internalSecret: z.string().min(10, 'Campo inválido'),
      }),
    })
    const result = schema.safeParse({ profile: { internalSecret: 'x' } })
    if (result.success) throw new Error('teste mal montado')
    const msg = toActionError(result.error)
    expect(msg).toBe('Campo inválido')
    expect(msg).not.toContain('internalSecret')
    expect(msg).not.toContain('profile')
  })
})

describe('toActionError — Postgrest/Postgres errors', () => {
  it('🛡️ unique violation (23505) → mensagem genérica', () => {
    const pgError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "profiles_email_key"',
      details: 'Key (email)=(foo@bar.com) already exists.',
    }
    const msg = toActionError(pgError)
    expect(msg).toBe('Este registro já existe.')
    // CRÍTICO: não vaza nome da constraint nem o valor
    expect(msg).not.toContain('profiles_email_key')
    expect(msg).not.toContain('foo@bar.com')
  })

  it('🛡️ foreign key violation (23503) → genérica', () => {
    const pgError = {
      code: '23503',
      message: 'insert or update on table "appointments" violates foreign key constraint "appointments_barber_id_fkey"',
    }
    const msg = toActionError(pgError)
    expect(msg).toBe('Operação inválida: registro relacionado não encontrado.')
    expect(msg).not.toContain('appointments_barber_id_fkey')
    expect(msg).not.toContain('appointments')
  })

  it('🛡️ not null violation (23502)', () => {
    expect(toActionError({ code: '23502', message: 'null value in column "phone"' }))
      .toBe('Campo obrigatório não preenchido.')
  })

  it('🛡️ check violation (23514)', () => {
    expect(toActionError({ code: '23514', message: 'check constraint violated' }))
      .toBe('Dados inválidos.')
  })

  it('🛡️ RLS deny (42501) → mensagem "Sem permissão" (não vaza policy name)', () => {
    expect(toActionError({
      code: '42501',
      message: 'new row violates row-level security policy "admin_only_writes" for table "plans"',
    })).toBe('Sem permissão.')
  })

  it('🛡️ PostgREST not found (PGRST116)', () => {
    expect(toActionError({ code: 'PGRST116' })).toBe('Registro não encontrado.')
  })

  it('🛡️ código desconhecido do Postgres → genérico (não vaza message)', () => {
    const msg = toActionError({ code: '99999', message: 'OBSCURE INTERNAL ERROR detalhes secretos' })
    expect(msg).toBe('Erro interno. Tente novamente.')
    expect(msg).not.toContain('OBSCURE')
    expect(msg).not.toContain('detalhes secretos')
  })
})

describe('toActionError — Supabase Auth errors', () => {
  it('email já registrado', () => {
    const err = { name: 'AuthApiError', message: 'User already registered', status: 400 }
    expect(toActionError(err)).toBe('Este e-mail já está cadastrado.')
  })

  it('login inválido', () => {
    const err = { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 }
    expect(toActionError(err)).toBe('E-mail ou senha incorretos.')
  })

  it('rate limit (status 429)', () => {
    const err = { name: 'AuthApiError', message: 'rate limit reached', status: 429 }
    expect(toActionError(err)).toBe('Muitas tentativas. Aguarde alguns minutos.')
  })

  it('email não confirmado', () => {
    const err = { name: 'AuthApiError', message: 'Email not confirmed', status: 400 }
    expect(toActionError(err)).toBe('Confirme seu e-mail antes de entrar.')
  })

  it('erro auth desconhecido → mensagem genérica de auth', () => {
    const err = { name: 'AuthSessionMissingError', message: 'algum detalhe interno' }
    expect(toActionError(err)).toBe('Erro de autenticação. Tente novamente.')
  })
})

describe('toActionError — erros desconhecidos (proteção crítica)', () => {
  it('🛡️ Error genérica → genérico (NÃO vaza message)', () => {
    const err = new Error('detalhes técnicos sensíveis sobre BD interno')
    const msg = toActionError(err)
    expect(msg).toBe('Erro interno. Tente novamente.')
    expect(msg).not.toContain('detalhes técnicos')
    expect(msg).not.toContain('BD interno')
  })

  it('🛡️ string lançada → genérico', () => {
    expect(toActionError('algum erro como string')).toBe('Erro interno. Tente novamente.')
  })

  it('🛡️ null/undefined → genérico', () => {
    expect(toActionError(null)).toBe('Erro interno. Tente novamente.')
    expect(toActionError(undefined)).toBe('Erro interno. Tente novamente.')
  })

  it('🛡️ objeto sem .message → genérico', () => {
    expect(toActionError({ foo: 'bar' })).toBe('Erro interno. Tente novamente.')
  })

  it('🛡️ TypeError com stack trace → genérico', () => {
    const err = new TypeError("Cannot read property 'id' of undefined")
    expect(toActionError(err)).toBe('Erro interno. Tente novamente.')
  })

  it('🛡️ erro com objeto aninhado → genérico (não recursivo)', () => {
    const err = { code: undefined, message: 'fail', inner: { secret: 'sensitive' } }
    const msg = toActionError(err)
    expect(msg).toBe('Erro interno. Tente novamente.')
    expect(msg).not.toContain('sensitive')
  })
})

describe('toActionError — ordem de precedência', () => {
  it('DomainError tem precedência sobre ZodError (custom class wins)', () => {
    expect(toActionError(new DomainError('regra de negócio'))).toBe('regra de negócio')
  })

  it('UnauthenticatedError tem precedência sobre tudo', () => {
    expect(toActionError(new UnauthenticatedError())).toBe('Não autenticado')
  })
})
