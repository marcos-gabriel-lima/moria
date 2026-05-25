import { describe, it, expect } from 'vitest'
import { isLikelyValidIp, parseForwardedFor, resolveClientIp } from '@/lib/client-ip'

describe('isLikelyValidIp', () => {
  it('aceita IPv4 válido', () => {
    expect(isLikelyValidIp('192.168.1.1')).toBe(true)
    expect(isLikelyValidIp('8.8.8.8')).toBe(true)
    expect(isLikelyValidIp('0.0.0.0')).toBe(true)
    expect(isLikelyValidIp('255.255.255.255')).toBe(true)
    expect(isLikelyValidIp('127.0.0.1')).toBe(true)
  })

  it('aceita IPv6 válido', () => {
    expect(isLikelyValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
    expect(isLikelyValidIp('::1')).toBe(true)
    expect(isLikelyValidIp('fe80::1')).toBe(true)
  })

  it('🛡️ rejeita IPv4 com octeto > 255', () => {
    expect(isLikelyValidIp('256.0.0.1')).toBe(false)
    expect(isLikelyValidIp('999.999.999.999')).toBe(false)
  })

  it('🛡️ rejeita strings não-IP', () => {
    expect(isLikelyValidIp('foo')).toBe(false)
    expect(isLikelyValidIp('localhost')).toBe(false)
    expect(isLikelyValidIp('192.168.1')).toBe(false) // incompleto
    expect(isLikelyValidIp('1.2.3.4.5')).toBe(false) // sobra
  })

  it('🛡️ rejeita strings com injection patterns', () => {
    expect(isLikelyValidIp("'; DROP TABLE--")).toBe(false)
    expect(isLikelyValidIp('<script>alert(1)</script>')).toBe(false)
    expect(isLikelyValidIp('192.168.1.1; rm -rf /')).toBe(false)
  })

  it('🛡️ rejeita string vazia, muito longa, ou não-string', () => {
    expect(isLikelyValidIp('')).toBe(false)
    expect(isLikelyValidIp('a'.repeat(100))).toBe(false)
    expect(isLikelyValidIp(null as unknown as string)).toBe(false)
    expect(isLikelyValidIp(undefined as unknown as string)).toBe(false)
    expect(isLikelyValidIp(123 as unknown as string)).toBe(false)
  })
})

describe('parseForwardedFor', () => {
  it('extrai primeiro IP de lista', () => {
    expect(parseForwardedFor('1.2.3.4, 5.6.7.8, 9.10.11.12')).toBe('1.2.3.4')
  })

  it('aceita single IP', () => {
    expect(parseForwardedFor('1.2.3.4')).toBe('1.2.3.4')
  })

  it('trim em espaços', () => {
    expect(parseForwardedFor('  1.2.3.4  , 5.6.7.8')).toBe('1.2.3.4')
  })

  it('retorna null se primeiro IP for inválido', () => {
    expect(parseForwardedFor('foo, 1.2.3.4')).toBe(null)
  })

  it('retorna null pra entrada vazia', () => {
    expect(parseForwardedFor('')).toBe(null)
    expect(parseForwardedFor(null)).toBe(null)
    expect(parseForwardedFor(undefined)).toBe(null)
  })

  it('🛡️ rejeita header forjado com texto não-IP', () => {
    expect(parseForwardedFor('lixo malicioso aqui')).toBe(null)
  })
})

describe('resolveClientIp', () => {
  it('prioriza x-forwarded-for', () => {
    expect(resolveClientIp({ forwardedFor: '1.2.3.4', realIp: '5.6.7.8' })).toBe('1.2.3.4')
  })

  it('cai pra x-real-ip se forwarded-for ausente', () => {
    expect(resolveClientIp({ forwardedFor: null, realIp: '5.6.7.8' })).toBe('5.6.7.8')
  })

  it('cai pra x-real-ip se forwarded-for inválido', () => {
    expect(resolveClientIp({ forwardedFor: 'forjado', realIp: '5.6.7.8' })).toBe('5.6.7.8')
  })

  it('retorna "unknown" se ambos ausentes', () => {
    expect(resolveClientIp({ forwardedFor: null, realIp: null })).toBe('unknown')
  })

  it('🛡️ "unknown" (não "anon") preserva sinal de problema no monitoramento', () => {
    expect(resolveClientIp({ forwardedFor: null, realIp: null })).toBe('unknown')
  })

  it('🛡️ rejeita IPs malformados em ambos headers', () => {
    expect(resolveClientIp({ forwardedFor: 'lixo', realIp: 'outro lixo' })).toBe('unknown')
    expect(resolveClientIp({ forwardedFor: '999.999.999.999', realIp: 'abc' })).toBe('unknown')
  })

  it('IPv6 aceito', () => {
    expect(resolveClientIp({ forwardedFor: '::1', realIp: null })).toBe('::1')
  })
})
