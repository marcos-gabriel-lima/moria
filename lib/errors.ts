// ── Hierarquia de erros de domínio ───────────────────────────
// Permite `catch (e) { if (e instanceof NotFoundError) ... }`
// sem perder type-safety.

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusHint: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class AuthError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Sem permissão') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity} não encontrado(a)`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

// ── Helpers ───────────────────────────────────────────────────

/** Converte qualquer erro em string de mensagem legível */
export function toMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (error instanceof Error)    return error.message
  if (typeof error === 'string') return error
  return 'Erro inesperado. Tente novamente.'
}

/** Mapeia códigos de erro do Supabase/BD em erros de domínio */
export function fromSupabaseError(error: { message?: string; code?: string }): AppError {
  const msg = error.message ?? ''
  if (msg.includes('BOOKING_TOO_FAR_AHEAD'))
    return new ValidationError('Não-assinantes só podem agendar com até 48h de antecedência.')
  if (msg.includes('SLOT_CONFLICT'))
    return new ConflictError('Este horário já está ocupado. Escolha outro horário.')
  if (msg.includes('SLOT_BLOCKED'))
    return new ConflictError('Este horário está bloqueado pelo barbeiro.')
  if (msg.includes('duplicate key') || msg.includes('unique constraint'))
    return new ConflictError('Registro duplicado.')
  if (msg.includes('violates foreign key'))
    return new ValidationError('Referência inválida.')
  return new AppError(msg || 'Erro no banco de dados', 'DB_ERROR')
}
