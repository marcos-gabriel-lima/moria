import 'server-only'
import { randomBytes } from 'node:crypto'

/**
 * Formato canônico do token de QR da assinatura: 64 chars hexadecimais
 * (= 32 bytes = 256 bits de entropia). Alinhado com o default do BD:
 *   qr_code_token text unique default encode(gen_random_bytes(32), 'hex')
 */
const QR_TOKEN_LENGTH = 64
const QR_TOKEN_REGEX = /^[0-9a-f]{64}$/

/**
 * Gera um token criptograficamente seguro pra QR de assinatura.
 *
 * Por que gerar em código em vez de confiar no DEFAULT do BD:
 *   - DEFAULT só aplica em INSERT sem o campo. Pra rotacionar em UPDATE
 *     (ativação, renovação) precisamos gerar explicitamente.
 *   - Garante consistência se o INSERT vier de fontes externas (admin SQL).
 */
export function generateQRToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Valida o formato do token (não consulta o BD).
 *
 * Aceita SOMENTE 64 chars hex minúsculos. Rejeita:
 *   - Strings curtas ou longas demais
 *   - Maiúsculas (não geramos com elas)
 *   - Outros charsets (base64, UUID com hífens, etc.)
 *   - Strings com espaços ou caracteres especiais
 *
 * Use no início de qualquer action que recebe token do client pra:
 *  - Falhar barato (sem hit no BD) com input malformado
 *  - Reduzir superfície de ataque (probing com formatos exóticos)
 */
export function isValidQRTokenFormat(token: unknown): token is string {
  if (typeof token !== 'string') return false
  if (token.length !== QR_TOKEN_LENGTH) return false
  return QR_TOKEN_REGEX.test(token)
}
