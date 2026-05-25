import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let _redis: Redis | null = null
function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!_redis) {
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

/**
 * Comportamento quando o backend de rate limit (Redis) está indisponível:
 *  - `open`:   deixa passar (UX vence; risco aceitável em endpoints de baixa criticidade)
 *  - `closed`: bloqueia (segurança vence; obrigatório em auth/brute-force)
 */
export type FailMode = 'open' | 'closed'

export type LimiterConfig = {
  requests: number
  window:   `${number} ${'s' | 'm' | 'h' | 'd'}`
  /** Comportamento se Redis cair. Default: 'open'. */
  failMode?: FailMode
}

const limiters = new Map<string, Ratelimit>()

function getLimiter(name: string, config: LimiterConfig): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  if (!limiters.has(name)) {
    limiters.set(
      name,
      new Ratelimit({
        redis,
        limiter:   Ratelimit.slidingWindow(config.requests, config.window),
        analytics: false,
        prefix:    `moria:${name}`,
      })
    )
  }
  return limiters.get(name)!
}

export type RateLimitResult = {
  success:   boolean
  remaining: number
  reset:     number
}

/**
 * Resolve o resultado do rate limit quando o backend está down.
 *
 * Função pura: separada do checkRateLimit pra ser testável sem mock de Redis.
 */
export function resolveFailureResult(config: LimiterConfig): RateLimitResult {
  const closed = config.failMode === 'closed'
  return {
    success:   !closed,
    remaining: 0,
    reset:     0,
  }
}

/**
 * Aplica rate limit por chave (user_id, IP ou outra).
 *
 * Quando o Redis não está configurado OU falha (rede/timeout/erro):
 *  - failMode 'open' (default): permite (UX preserva)
 *  - failMode 'closed': bloqueia (proteção contra brute force)
 *
 * Logamos via console.error em falhas pra que o problema fique visível em prod.
 */
export async function checkRateLimit(
  name:   string,
  key:    string,
  config: LimiterConfig
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, config)
  if (!limiter) {
    // Sem Redis configurado: silencioso (esperado em dev local)
    return resolveFailureResult(config)
  }

  try {
    const result = await limiter.limit(key)
    return { success: result.success, remaining: result.remaining, reset: result.reset }
  } catch (err) {
    // Importante: logar pra produção detectar (Sentry pega via console.error wrap)
    console.error(`[rate-limit] ${name} falhou pra key=${key.slice(0, 12)}…`, err)
    return resolveFailureResult(config)
  }
}

// ─── Configurações pré-definidas (limites por endpoint) ─────────────────────

export const RATE_LIMITS = {
  /** Login/Signup — protege contra força bruta. FAIL-CLOSED (segurança vence) */
  auth:           { requests: 5,  window: '1 m', failMode: 'closed' } as LimiterConfig,
  /** Criar agendamento — evita spam. Fail-open: cliente real não sofre por outage do Redis */
  createBooking:  { requests: 5,  window: '1 m' } as LimiterConfig,
  /** Consultar horários disponíveis — evita enumeração */
  availableSlots: { requests: 30, window: '1 m' } as LimiterConfig,
  /** Solicitar assinatura — evita spam */
  subscribe:      { requests: 3,  window: '1 m' } as LimiterConfig,
  /** Validar QR de assinatura — bloqueia brute force de token. FAIL-CLOSED */
  qrVerify:       { requests: 10, window: '1 m', failMode: 'closed' } as LimiterConfig,
  /** Ações administrativas pesadas */
  adminAction:    { requests: 20, window: '1 m' } as LimiterConfig,
} as const
