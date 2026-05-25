import { describe, it, expect } from 'vitest'
import { generateQRToken, isValidQRTokenFormat } from '@/lib/qr-token'

describe('generateQRToken', () => {
  it('gera token com exatamente 64 caracteres', () => {
    expect(generateQRToken()).toHaveLength(64)
  })

  it('gera apenas caracteres hex minúsculos', () => {
    const token = generateQRToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('gera tokens diferentes a cada chamada (sanity)', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateQRToken()))
    expect(tokens.size).toBe(100)
  })

  it('tokens gerados passam pela própria validação', () => {
    for (let i = 0; i < 20; i++) {
      expect(isValidQRTokenFormat(generateQRToken())).toBe(true)
    }
  })
})

describe('isValidQRTokenFormat — formato strict', () => {
  const validToken = 'a'.repeat(64)

  it('aceita 64 chars hex válidos', () => {
    expect(isValidQRTokenFormat(validToken)).toBe(true)
    expect(isValidQRTokenFormat('0123456789abcdef'.repeat(4))).toBe(true)
  })

  it('🛡️ rejeita string curta', () => {
    expect(isValidQRTokenFormat('a'.repeat(63))).toBe(false)
    expect(isValidQRTokenFormat('abc')).toBe(false)
    expect(isValidQRTokenFormat('')).toBe(false)
  })

  it('🛡️ rejeita string longa', () => {
    expect(isValidQRTokenFormat('a'.repeat(65))).toBe(false)
    expect(isValidQRTokenFormat('a'.repeat(128))).toBe(false)
  })

  it('🛡️ rejeita caracteres não-hex', () => {
    expect(isValidQRTokenFormat('z'.repeat(64))).toBe(false)
    expect(isValidQRTokenFormat('g'.repeat(64))).toBe(false)
    expect(isValidQRTokenFormat('!'.repeat(64))).toBe(false)
  })

  it('🛡️ rejeita maiúsculas (gen_random_bytes só produz minúsculas)', () => {
    expect(isValidQRTokenFormat('A'.repeat(64))).toBe(false)
    expect(isValidQRTokenFormat('ABCDEF0123456789'.repeat(4))).toBe(false)
  })

  it('🛡️ rejeita UUIDs (formato com hífens)', () => {
    // UUID v4 tem 36 chars com hífens — bem diferente do nosso 64 hex
    expect(isValidQRTokenFormat('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
  })

  it('🛡️ rejeita base64 disfarçado', () => {
    // String com `+`, `/`, `=` típicos de base64
    expect(isValidQRTokenFormat('AbCdEf+/==' + 'a'.repeat(54))).toBe(false)
  })

  it('🛡️ rejeita string com espaços ou whitespace', () => {
    expect(isValidQRTokenFormat(' '.repeat(64))).toBe(false)
    expect(isValidQRTokenFormat('a'.repeat(32) + ' ' + 'a'.repeat(31))).toBe(false)
    expect(isValidQRTokenFormat('\n'.repeat(64))).toBe(false)
  })

  it('🛡️ rejeita tipos não-string', () => {
    expect(isValidQRTokenFormat(null)).toBe(false)
    expect(isValidQRTokenFormat(undefined)).toBe(false)
    expect(isValidQRTokenFormat(123)).toBe(false)
    expect(isValidQRTokenFormat({})).toBe(false)
    expect(isValidQRTokenFormat([])).toBe(false)
    expect(isValidQRTokenFormat(true)).toBe(false)
  })

  it('🛡️ rejeita strings de SQL injection comuns', () => {
    expect(isValidQRTokenFormat("' OR '1'='1")).toBe(false)
    expect(isValidQRTokenFormat('1; DROP TABLE subscriptions; --')).toBe(false)
  })

  it('🛡️ rejeita scripts XSS', () => {
    expect(isValidQRTokenFormat('<script>alert(1)</script>')).toBe(false)
  })

  it('type guard: narrowing funciona após validação', () => {
    const input: unknown = 'a'.repeat(64)
    if (isValidQRTokenFormat(input)) {
      // dentro do bloco, TS sabe que é string
      const t: string = input
      expect(t.length).toBe(64)
    }
  })
})
