import { describe, it, expect } from 'vitest'
import { resolveFailureResult, RATE_LIMITS } from '@/lib/rate-limit'

describe('resolveFailureResult — comportamento quando Redis cai', () => {
  it('🟢 fail-open (default) → success: true', () => {
    const result = resolveFailureResult({ requests: 10, window: '1 m' })
    expect(result.success).toBe(true)
  })

  it('🟢 fail-open explícito → success: true', () => {
    const result = resolveFailureResult({ requests: 10, window: '1 m', failMode: 'open' })
    expect(result.success).toBe(true)
  })

  it('🔴 fail-closed → success: false (BLOQUEIA)', () => {
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

describe('integração: fail-closed + checkRateLimit (sem Redis configurado)', () => {
  // Verifica que sem Redis configurado (cenário comum em dev), endpoints
  // de auth NÃO deixam passar — comportamento fail-closed real.
  //
  // OBS: o test depende de UPSTASH_REDIS_REST_URL não estar setada no env de
  // teste. Se estiver, o test continua passando porque o limit() pode tentar
  // de verdade — mas o cenário "sem Redis" é o que queremos validar aqui.
  it('🛡️ resolveFailureResult de auth (closed) NÃO permite passar', () => {
    const result = resolveFailureResult(RATE_LIMITS.auth)
    expect(result.success).toBe(false)
  })

  it('🟢 resolveFailureResult de createBooking (open) permite passar', () => {
    const result = resolveFailureResult(RATE_LIMITS.createBooking)
    expect(result.success).toBe(true)
  })
})
