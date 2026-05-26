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

/** Pass-through (success sempre). Usado quando o backend não está configurado. */
function passThrough(config: LimiterConfig): RateLimitResult {
  return { success: true, remaining: config.requests, reset: 0 }
}

/**
 * Resolve o resultado do rate limit quando o backend está configurado MAS
 * falhou em runtime (timeout, erro de rede, etc.).
 *
 * Função pura: separada do checkRateLimit pra ser testável sem mock de Redis.
 *
 * IMPORTANTE: só aplica quando Redis EXISTE e falhou. Quando Redis nunca foi
 * configurado, usa `passThrough` em vez disso — porque "configuração ausente"
 * não deve impedir o usuário de cadastrar.
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
 * Comportamento por cenário:
 *  1. Redis NÃO configurado (env vars ausentes) → passa SEMPRE
 *     (não tratamos isso como "outage"; é deploy sem Upstash, esperado em dev)
 *  2. Redis configurado, limit OK             → resultado do Upstash
 *  3. Redis configurado, runtime falha        → respeita `failMode`:
 *       - open   → passa (UX preserva em outage temporário)
 *       - closed → bloqueia (proteção contra brute force quando Redis cai)
 *
 * Logamos `console.error` no caminho 3 pra que o Sentry capture.
 */
export async function checkRateLimit(
  name:   string,
  key:    string,
  config: LimiterConfig
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, config)
  if (!limiter) {
    // Cenário 1: sem Redis configurado — não é falha, é setup opcional ausente.
    // Aplicar failMode aqui quebraria signup/signin em deploys sem Upstash.
    return passThrough(config)
  }

  try {
    const result = await limiter.limit(key)
    return { success: result.success, remaining: result.remaining, reset: result.reset }
  } catch (err) {
    // Cenário 3: Redis configurado mas falhou — agora SIM aplica failMode.
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
