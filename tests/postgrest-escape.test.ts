import { describe, it, expect } from 'vitest'
import { escapeIlikeForOr, buildIlikeOr } from '@/lib/postgrest-escape'

describe('escapeIlikeForOr — strings comuns', () => {
  it('aceita texto simples', () => {
    expect(escapeIlikeForOr('joao')).toBe('joao')
  })

  it('aceita texto com espaços', () => {
    expect(escapeIlikeForOr('joao silva')).toBe('joao silva')
  })

  it('aceita acentos e caracteres não-ASCII', () => {
    expect(escapeIlikeForOr('João Maçã')).toBe('João Maçã')
  })

  it('aceita números', () => {
    expect(escapeIlikeForOr('11 99999-8888')).toBe('11 99999-8888')
  })
})

describe('escapeIlikeForOr — defesa contra injection no PostgREST .or()', () => {
  it('🛡️ remove vírgula (separador de cláusulas do .or)', () => {
    // user tenta injetar segunda cláusula: "a,role.eq.admin"
    expect(escapeIlikeForOr('a,role.eq.admin')).toBe('aroleeqadmin')
  })

  it('🛡️ remove parêntese e aspas (delimitadores PostgREST)', () => {
    expect(escapeIlikeForOr('test(injection)"quote\'')).toBe('testinjectionquote')
  })

  it('🛡️ remove ponto (separador de campo/operador)', () => {
    expect(escapeIlikeForOr('a.b.c')).toBe('abc')
  })

  it('🛡️ remove dois-pontos e asterisco', () => {
    expect(escapeIlikeForOr('foo*bar:baz')).toBe('foobarbaz')
  })

  it('🛡️ rejeita só caracteres especiais (retorna vazio)', () => {
    expect(escapeIlikeForOr(',,,...((()))')).toBe('')
  })
})

describe('escapeIlikeForOr — escape de wildcards ILIKE', () => {
  it('🛡️ escapa % (wildcard ILIKE)', () => {
    expect(escapeIlikeForOr('100%')).toBe('100\\%')
  })

  it('🛡️ escapa _ (single-char wildcard ILIKE)', () => {
    expect(escapeIlikeForOr('a_b')).toBe('a\\_b')
  })

  it('🛡️ escapa backslash', () => {
    expect(escapeIlikeForOr('path\\file')).toBe('path\\\\file')
  })

  it('🛡️ múltiplos wildcards', () => {
    expect(escapeIlikeForOr('100%_disc')).toBe('100\\%\\_disc')
  })
})

describe('escapeIlikeForOr — limites', () => {
  it('🛡️ limita a 80 chars (proteção DoS)', () => {
    const longInput = 'a'.repeat(200)
    expect(escapeIlikeForOr(longInput).length).toBeLessThanOrEqual(80)
  })

  it('🛡️ remove caracteres de controle (newline, tab, NUL)', () => {
    expect(escapeIlikeForOr('a\nb\tc\0d')).toBe('abcd')
  })

  it('rejeita não-string', () => {
    expect(escapeIlikeForOr(null as unknown as string)).toBe('')
    expect(escapeIlikeForOr(undefined as unknown as string)).toBe('')
    expect(escapeIlikeForOr(123 as unknown as string)).toBe('')
  })

  it('faz trim do resultado', () => {
    expect(escapeIlikeForOr('  joao  ')).toBe('joao')
  })
})

describe('buildIlikeOr', () => {
  it('monta cláusula com múltiplas colunas', () => {
    const out = buildIlikeOr(['name', 'phone', 'email'], 'joao')
    expect(out).toBe('name.ilike.%joao%,phone.ilike.%joao%,email.ilike.%joao%')
  })

  it('retorna vazio se query for vazio após escape', () => {
    expect(buildIlikeOr(['name'], ',,,')).toBe('')
    expect(buildIlikeOr(['name'], '')).toBe('')
  })

  it('🛡️ query maliciosa não cria cláusulas extras', () => {
    const out = buildIlikeOr(['name'], 'a,role.eq.admin')
    // Garantia: NÃO contém o pattern "role.eq.admin" intacto
    expect(out).not.toContain('role.eq.admin')
    // Continua sendo APENAS UMA cláusula no top-level (1 vírgula = 0 separadores extras)
    const topLevelClauses = out.split(',').length
    expect(topLevelClauses).toBe(1)
  })

  it('🛡️ wildcards no input não escapam o padrão de match externo', () => {
    const out = buildIlikeOr(['name'], '100%')
    // % do input vira \% literal — o % externo (do %...%) fica intacto
    expect(out).toBe('name.ilike.%100\\%%')
  })
})
