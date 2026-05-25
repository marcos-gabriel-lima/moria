// Helpers puros pra identificar o IP do cliente — testáveis isoladamente.

/** IPv4 dotted quad com cada octeto 0-255. */
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

/**
 * IPv6 — validação pragmática: apenas hex e dois-pontos.
 *
 * NÃO é um parser RFC 4291 completo (formas abreviadas com `::` são
 * complexas). O objetivo é defesa: rejeitar strings que contenham
 * caracteres não-hex/non-colon (injection, XSS, paths). Strings malformadas
 * de IPv6 mas só com hex+colons viram chave Redis "ruim" — não causam dano.
 */
const IPV6_REGEX = /^[0-9a-fA-F:]{2,45}$/

/**
 * Verifica se a string parece um IP válido. Não é validação completa —
 * objetivo é descartar headers forjados com lixo (SQL injection, XSS,
 * paths) antes de virarem chave Redis.
 */
export function isLikelyValidIp(ip: string): boolean {
  if (typeof ip !== 'string' || ip.length === 0 || ip.length > 45) return false
  if (IPV4_REGEX.test(ip)) return true
  if (!ip.includes(':')) return false
  return IPV6_REGEX.test(ip)
}

/**
 * Extrai o primeiro IP da string `x-forwarded-for` (que pode ter múltiplos
 * IPs separados por vírgula). Retorna `null` se não houver IP válido.
 */
export function parseForwardedFor(value: string | null | undefined): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  if (!first) return null
  return isLikelyValidIp(first) ? first : null
}

/**
 * Resolve o IP do cliente a partir dos headers do request.
 *
 * Estratégia (em ordem):
 *  1. `x-forwarded-for` (primeiro IP, validado)
 *  2. `x-real-ip` (validado)
 *  3. Sentinel `'unknown'` (NÃO 'anon' — preserva o sinal de problema no monitoramento)
 *
 * Se o header trouxer string malformada (forja, proxy mal configurado), retornamos
 * 'unknown' em vez de propagar lixo pra chave do rate limiter.
 */
export function resolveClientIp(headers: {
  forwardedFor: string | null
  realIp:       string | null
}): string {
  const forwarded = parseForwardedFor(headers.forwardedFor)
  if (forwarded) return forwarded
  const realIp = headers.realIp?.trim()
  if (realIp && isLikelyValidIp(realIp)) return realIp
  return 'unknown'
}
