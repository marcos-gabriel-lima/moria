import { ZodError } from 'zod'

/**
 * Erros tipados para Server Actions.
 *
 * O padrão antigo capturava qualquer `e` e retornava `e.message` direto pro
 * client. Isso vaza detalhes internos do BD (nomes de constraints, schema,
 * mensagens do Postgres) e configura Information Disclosure (OWASP A09).
 *
 * Agora cada action lança erros tipados; `toActionError()` traduz pra
 * mensagens seguras de UI. Erros desconhecidos retornam mensagem genérica.
 */

export class UnauthenticatedError extends Error {
  readonly kind = 'unauthenticated' as const
  constructor(message = 'Não autenticado') { super(message) }
}

export class ForbiddenError extends Error {
  readonly kind = 'forbidden' as const
  constructor(message = 'Sem permissão') { super(message) }
}

/**
 * Erro de domínio — mensagens seguras pra UI (ex: "Horário já reservado").
 * Use quando a regra de negócio precisa ser comunicada ao usuário.
 */
export class DomainError extends Error {
  readonly kind = 'domain' as const
}

// ── Mapeamento de erros do PostgREST/Postgres ─────────────────────────

type PostgrestLike = { code?: string; message?: string; details?: string }

function isPostgrestError(e: unknown): e is PostgrestLike {
  return typeof e === 'object' && e !== null && 'code' in e
}

const POSTGRES_CODE_MESSAGES: Record<string, string> = {
  // Códigos SQLSTATE comuns — manter mensagens GENÉRICAS pra não vazar schema
  '23505': 'Este registro já existe.',
  '23503': 'Operação inválida: registro relacionado não encontrado.',
  '23502': 'Campo obrigatório não preenchido.',
  '23514': 'Dados inválidos.',
  '42501': 'Sem permissão.',          // RLS deny / insufficient_privilege
  '42P01': 'Erro de configuração.',   // undefined_table (não deveria chegar aqui)
  'PGRST116': 'Registro não encontrado.', // PostgREST "Not Found"
  'PGRST301': 'Sem permissão.',           // PostgREST JWT issues
}

function mapPostgrestError(e: PostgrestLike): string {
  if (e.code && POSTGRES_CODE_MESSAGES[e.code]) return POSTGRES_CODE_MESSAGES[e.code]
  return 'Erro interno. Tente novamente.'
}

// ── Mapeamento de erros do Supabase Auth ──────────────────────────────

type AuthLike = { name?: string; message?: string; status?: number }

function isAuthError(e: unknown): e is AuthLike {
  return typeof e === 'object' && e !== null && 'name' in e &&
    typeof (e as { name: unknown }).name === 'string' &&
    String((e as { name: string }).name).startsWith('Auth')
}

function mapAuthError(e: AuthLike): string {
  const msg = String(e.message ?? '')
  if (msg.includes('already registered'))  return 'Este e-mail já está cadastrado.'
  if (msg.includes('Invalid login'))       return 'E-mail ou senha incorretos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (e.status === 429)                    return 'Muitas tentativas. Aguarde alguns minutos.'
  return 'Erro de autenticação. Tente novamente.'
}

// ── ZodError → string amigável ────────────────────────────────────────

function mapZodError(e: ZodError): string {
  // Pegamos só o primeiro erro — o usuário corrige um por vez na UI.
  const first = e.errors[0]
  if (!first) return 'Dados inválidos.'
  // Não anexa o caminho ('user.name'): expõe a estrutura interna.
  return first.message
}

// ── Sanitizador principal ────────────────────────────────────────────

/**
 * Traduz um `unknown` (capturado num catch) em mensagem segura pra UI.
 *
 * Reconhece (nessa ordem):
 *  1. Erros tipados de auth: UnauthenticatedError / ForbiddenError / DomainError
 *  2. ZodError → primeira mensagem de validação
 *  3. Postgrest/Postgres → mensagem por código (genérica)
 *  4. Supabase Auth → mensagem mapeada
 *  5. Qualquer outra coisa → "Erro interno. Tente novamente."
 *
 * Erros desconhecidos NUNCA expõem `.message` original (proteção contra
 * Information Disclosure).
 */
export function toActionError(e: unknown): string {
  if (e instanceof UnauthenticatedError) return e.message
  if (e instanceof ForbiddenError)       return e.message
  if (e instanceof DomainError)          return e.message
  if (e instanceof ZodError)             return mapZodError(e)
  if (isAuthError(e))                    return mapAuthError(e)
  if (isPostgrestError(e))               return mapPostgrestError(e)
  return 'Erro interno. Tente novamente.'
}
