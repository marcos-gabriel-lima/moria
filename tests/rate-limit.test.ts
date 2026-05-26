import { describe, it, expect } from 'vitest'
import { resolveFailureResult, checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

describe('resolveFailureResult — comportamento quando Redis configurado mas falha em runtime', () => {
  it('🟢 fail-open (default) → success: true', () => {
    const result = resolveFailureResult({ requests: 10, window: '1 m' })
    expect(result.success).toBe(true)
  })

  it('🟢 fail-open explícito → success: true', () => {
    const result = resolveFailureResult({ requests: 10, window: '1 m', failMode: 'open' })
    expect(result.success).toBe(true)
  })

  it('🔴 fail-closed → success: false (BLOQUEIA durante outage do Redis)', () => {
    const result = resolveFailureResult({ requests: 10, window: '1 m', failMode: 'closed' })
    expect(result.success).toBe(false)
  })

  it('sempre retorna remaining=0 e reset=0 em falha (dados não confiáveis)', () => {
    const open = resolveFailureResult({ requests: 10, window: '1 m', failMode: 'open' })
    const closed = resolveFailureResult({ requests: 10, window: '1 m', failMode: 'closed' })
    expect(open.remaining).toBe(0)
    expect(open.reset).toBe(0)
    expect(closed.remaining).toBe(0)
    expect(closed.reset).toBe(0)
  })
})

describe('RATE_LIMITS — configs pré-definidas', () => {
  it('🛡️ auth é fail-closed (proteção contra brute force)', () => {
    expect(RATE_LIMITS.auth.failMode).toBe('closed')
  })

  it('🛡️ qrVerify é fail-closed (proteção contra brute force de token)', () => {
    expect(RATE_LIMITS.qrVerify.failMode).toBe('closed')
  })

  it('🟢 createBooking é fail-open (UX preserva — outage não bloqueia cliente)', () => {
    expect(RATE_LIMITS.createBooking.failMode).toBeUndefined()
  })

  it('🟢 availableSlots é fail-open', () => {
    expect(RATE_LIMITS.availableSlots.failMode).toBeUndefined()
  })

  it('🟢 subscribe é fail-open', () => {
    expect(RATE_LIMITS.subscribe.failMode).toBeUndefined()
  })

  it('🟢 adminAction é fail-open', () => {
    expect(RATE_LIMITS.adminAction.failMode).toBeUndefined()
  })

  it('auth: 5 tentativas/min (brute force protection)', () => {
    expect(RATE_LIMITS.auth.requests).toBe(5)
    expect(RATE_LIMITS.auth.window).toBe('1 m')
  })

  it('qrVerify: 10 tentativas/min', () => {
    expect(RATE_LIMITS.qrVerify.requests).toBe(10)
    expect(RATE_LIMITS.qrVerify.window).toBe('1 m')
  })

  it('subscribe: limite baixo (3/min) — evita spam de pedidos pendentes', () => {
    expect(RATE_LIMITS.subscribe.requests).toBe(3)
  })
})

describe('checkRateLimit — sem Redis configurado (env vars ausentes)', () => {
  // Pré-condição: estes testes assumem que UPSTASH_REDIS_REST_URL/TOKEN
  // não estão setadas no ambiente de teste (caso típico).

  it('🐛 REGRESSÃO — sem Redis, auth (fail-closed) DEVE passar (não bloquear signup)', async () => {
    // Bug: antes, fail-closed bloqueava mesmo sem Redis configurado, quebrando
    // signup/signin em deploys sem Upstash. Configuração ausente != "outage".
    const result = await checkRateLimit('test-signup', 'user-123', RATE_LIMITS.auth)
    expect(result.success).toBe(true)
  })

  it('sem Redis, qrVerify (fail-closed) também passa', async () => {
    const result = await checkRateLimit('test-qr', 'user-123', RATE_LIMITS.qrVerify)
    expect(result.success).toBe(true)
  })

  it('sem Redis, createBooking (fail-open) passa (igual ao caso closed)', async () => {
    const result = await checkRateLimit('test-booking', 'user-123', RATE_LIMITS.createBooking)
    expect(result.success).toBe(true)
  })

  it('remaining retorna config.requests quando passa direto (sem Redis)', async () => {
    const result = await checkRateLimit('test-x', 'user-123', RATE_LIMITS.auth)
    expect(result.remaining).toBe(5) // config.auth.requests
  })
})
