// Helpers puros para escape de HTML — testáveis sem dependências.
//
// Usado em emails (lib/email) onde dados do usuário (nome, plano, serviço)
// são interpolados em templates HTML. Sem escape, atacante consegue injetar
// markup malicioso (img de tracking, links de phishing, atributos quebrados).

const HTML_ENTITIES: Record<string, string> = {
  '&':  '&amp;',
  '<':  '&lt;',
  '>':  '&gt;',
  '"':  '&quot;',
  "'":  '&#39;',
  '/':  '&#x2F;',
  '`':  '&#x60;',
}

/**
 * Escapa caracteres especiais de HTML pra interpolação segura em corpo de
 * tags (entre `<p>...</p>` ou similar).
 *
 * Não use pra valores de atributo dentro de aspas simples — `'` é escapado
 * mas se você usa aspas simples no atributo (`href='...'`), revise.
 * Padrão MORIA: usamos aspas duplas em atributos, então `&quot;` é o
 * essencial.
 *
 * @example
 *   escapeHtml('<script>alert(1)</script>') // '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
 *   escapeHtml('João "O Carequinha"')       // 'João &quot;O Carequinha&quot;'
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return ''
  const s = String(input)
  let out = ''
  for (const ch of s) {
    out += HTML_ENTITIES[ch] ?? ch
  }
  return out
}

/**
 * Valida URL pra uso em atributo `href`. Aceita apenas:
 *   - URLs absolutas com scheme http/https
 *   - URLs `mailto:` e `tel:`
 *
 * Rejeita `javascript:`, `data:`, `file:`, paths relativos sem scheme,
 * e qualquer string que contenha aspas/control chars (HTML injection).
 *
 * Retorna `null` se inválido. Caller decide fallback.
 */
export function safeHref(input: unknown): string | null {
  if (typeof input !== 'string' || input.length === 0 || input.length > 2048) return null
  if (/[\s<>"'`]/.test(input)) return null // bloqueia espaço/aspas/control
  if (/^javascript:/i.test(input)) return null
  if (/^data:/i.test(input)) return null
  if (/^file:/i.test(input)) return null
  if (/^vbscript:/i.test(input)) return null
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(input)) return null
  return input
}
