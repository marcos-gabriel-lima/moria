// Helpers puros pra escapar valores de usuário em queries do PostgREST.

const ILIKE_MAX_LENGTH = 80
const ILIKE_REPLACEMENTS: Record<string, string> = {
  // Wildcards do ILIKE — escapamos pra busca literal
  '%': '\\%',
  '_': '\\_',
  '\\': '\\\\',
}

const POSTGREST_SPECIAL_CHARS = new Set([',', '(', ')', '"', "'", '*', '.', ':'])

/**
 * Escapa uma string pra ser usada com segurança como pattern de ILIKE
 * dentro de uma cláusula `.or()` do PostgREST.
 *
 * Problemas que evita:
 *
 *  1. **Separador `,`**: `.or('a.ilike.X,b.ilike.Y')` interpreta `,` como
 *     "OU outra cláusula". User com `query="a,role.eq.admin"` tenta injetar
 *     filtro extra. Trocamos `,` por nada (deletado — sem `,` na busca).
 *
 *  2. **Wildcards `%` e `_`**: usuário buscando por "10%" não quer match
 *     com qualquer string contendo "10". Escapamos como `\%`.
 *
 *  3. **Parêntese e aspas**: chars que PostgREST trata como delimitadores
 *     ou que podem confundir o parser. Removemos.
 *
 *  4. **Tamanho**: limita a 80 chars pra evitar payload DoS.
 *
 * Resultado: string segura pra interpolar em `ilike.%${escaped}%`.
 */
export function escapeIlikeForOr(input: string): string {
  if (typeof input !== 'string') return ''

  let escaped = ''
  for (const ch of input) {
    if (escaped.length >= ILIKE_MAX_LENGTH) break

    // 1) Wildcards do ILIKE → escape com \
    if (ch in ILIKE_REPLACEMENTS) {
      escaped += ILIKE_REPLACEMENTS[ch]
      continue
    }
    // 2) Special chars do PostgREST → deletar (mais simples que quoting)
    if (POSTGREST_SPECIAL_CHARS.has(ch)) continue
    // 3) Quebra de linha / controle → deletar
    if (ch.charCodeAt(0) < 32) continue

    escaped += ch
  }
  return escaped.trim()
}

/**
 * Monta a cláusula `.or()` pra busca multi-campo, com escape automático.
 *
 * @example
 *   buildIlikeOr(['full_name', 'phone'], 'jo%n') // → "full_name.ilike.%jo\\%n%,phone.ilike.%jo\\%n%"
 */
export function buildIlikeOr(columns: string[], rawQuery: string): string {
  const escaped = escapeIlikeForOr(rawQuery)
  if (!escaped) return ''
  return columns.map(col => `${col}.ilike.%${escaped}%`).join(',')
}
