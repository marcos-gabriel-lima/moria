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

type LimiterConfig = {
  requests: number
  window:   `${number} ${'s' | 'm' | 'h' | 'd'}`
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
 * Aplica rate limit por chave (geralmente user_id).
 * Se Upstash não estiver configurado, sempre permite (fail-open p/ não quebrar prod sem Redis).
 */
export async function checkRateLimit(
  name:   string,
  key:    string,
  config: LimiterConfig
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, config)
  if (!limiter) return { success: true, remaining: config.requests, reset: 0 }

  try {
    const result = await limiter.limit(key)
    return { success: result.success, remaining: result.remaining, reset: result.reset }
  } catch {
    // Se o Redis falhar, deixa passar (fail-open). Em produção sob ataque o admin pode trocar p/ fail-closed.
    return { success: true, remaining: config.requests, reset: 0 }
  }
}

// ─── Configurações pré-definidas (limites por endpoint) ─────────────────────

export const RATE_LIMITS = {
  /** Login/Signup — protege contra força bruta */
  auth:           { requests: 5,  window: '1 m' } as LimiterConfig,
  /** Criar agendamento — evita spam */
  createBooking:  { requests: 5,  window: '1 m' } as LimiterConfig,
  /** Consultar horários disponíveis — evita enumeração */
  availableSlots: { requests: 30, window: '1 m' } as LimiterConfig,
  /** Solicitar assinatura — evita spam */
  subscribe:      { requests: 3,  window: '1 m' } as LimiterConfig,
  /** Validar QR de assinatura — bloqueia brute force de token */
  qrVerify:       { requests: 10, window: '1 m' } as LimiterConfig,
  /** Ações administrativas pesadas */
  adminAction:    { requests: 20, window: '1 m' } as LimiterConfig,
} as const
