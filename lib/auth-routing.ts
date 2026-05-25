// Lógica pura de roteamento de auth — isolada do Next/Supabase pra ser testável.

const PROTECTED_PREFIXES = [
  '/admin',
  '/barber',
  '/dashboard',
  '/appointments',
  '/plans',
  '/wallet',
  '/products',
] as const

const AUTH_PREFIXES = ['/login', '/register'] as const

/**
 * Compara `pathname` contra um prefixo respeitando fronteiras de segmento.
 *
 * `/admin` casa com `/admin` e `/admin/clients`, mas NÃO com `/administrador`
 * (proteção contra match por substring).
 */
function matchesPrefix(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true
  return pathname.startsWith(prefix + '/')
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(p => matchesPrefix(pathname, p))
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_PREFIXES.some(p => matchesPrefix(pathname, p))
}

export type AuthAction =
  | { kind: 'pass' }
  | { kind: 'redirect'; to: '/login' | '/dashboard' }

/**
 * Decide o que o middleware deve fazer dado o pathname e o estado de auth.
 *
 *  - Rota protegida + sem user             → redirect /login
 *  - Rota de auth (/login,/register) + user → redirect /dashboard
 *  - Demais combinações                    → pass
 *
 * O guard de role (admin/barber/client) NÃO acontece aqui — fica nos layouts
 * que têm acesso direto ao perfil. Aqui só validamos autenticação.
 */
export function resolveAuthAction(pathname: string, hasUser: boolean): AuthAction {
  if (!hasUser && isProtectedRoute(pathname)) {
    return { kind: 'redirect', to: '/login' }
  }
  if (hasUser && isAuthRoute(pathname)) {
    return { kind: 'redirect', to: '/dashboard' }
  }
  return { kind: 'pass' }
}

/**
 * Valida um parâmetro `next=...` de redirect pós-login.
 *
 * Aceita apenas paths absolutos do MESMO ORIGIN (começando com `/` seguido
 * de um caractere de path normal). Rejeita:
 *
 *   - URLs absolutas (`https://evil.com/...`)
 *   - Protocol-relative (`//evil.com/...`)        ← bug do open redirect
 *   - Backslash (`/\\evil.com`)                   ← alguns browsers normalizam
 *   - Strings vazias ou que não começam com `/`
 *
 * Se inválido, retorna o fallback (padrão `/dashboard`).
 */
export function safeNextPath(input: string | null | undefined, fallback = '/dashboard'): string {
  if (typeof input !== 'string') return fallback
  if (input.length === 0) return fallback
  if (input[0] !== '/') return fallback
  // Bloqueia `//host` e `/\\host` (interpretados como protocol-relative)
  if (input.length >= 2 && (input[1] === '/' || input[1] === '\\')) return fallback
  // Bloqueia esquemas embutidos tipo `/javascript:alert(1)` — defensivo
  if (input.includes(':')) return fallback
  return input
}
