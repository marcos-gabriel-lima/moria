import { describe, it, expect } from 'vitest'
import {
  isProtectedRoute,
  isAuthRoute,
  resolveAuthAction,
  safeNextPath,
} from '@/lib/auth-routing'

describe('isProtectedRoute', () => {
  it('reconhece rotas protegidas exatas', () => {
    expect(isProtectedRoute('/admin')).toBe(true)
    expect(isProtectedRoute('/barber')).toBe(true)
    expect(isProtectedRoute('/dashboard')).toBe(true)
    expect(isProtectedRoute('/appointments')).toBe(true)
    expect(isProtectedRoute('/plans')).toBe(true)
    expect(isProtectedRoute('/wallet')).toBe(true)
    expect(isProtectedRoute('/products')).toBe(true)
  })

  it('reconhece sub-rotas', () => {
    expect(isProtectedRoute('/admin/clients')).toBe(true)
    expect(isProtectedRoute('/admin/clients/123')).toBe(true)
    expect(isProtectedRoute('/barber/schedule')).toBe(true)
  })

  it('🐛 REGRESSÃO — NÃO casa com substring fora do segmento', () => {
    // Bug antigo: pathname.startsWith('/admin') casaria com '/administrador'
    expect(isProtectedRoute('/administrador')).toBe(false)
    expect(isProtectedRoute('/dashboards')).toBe(false)
    expect(isProtectedRoute('/walletx')).toBe(false)
    expect(isProtectedRoute('/barberbypass')).toBe(false)
  })

  it('libera rotas públicas', () => {
    expect(isProtectedRoute('/')).toBe(false)
    expect(isProtectedRoute('/login')).toBe(false)
    expect(isProtectedRoute('/register')).toBe(false)
    expect(isProtectedRoute('/api/cron/foo')).toBe(false)
    expect(isProtectedRoute('/_next/static/foo.js')).toBe(false)
  })
})

describe('isAuthRoute', () => {
  it('reconhece /login e /register', () => {
    expect(isAuthRoute('/login')).toBe(true)
    expect(isAuthRoute('/register')).toBe(true)
  })

  it('reconhece query strings (irrelevante pro pathname)', () => {
    // pathname já vem sem query
    expect(isAuthRoute('/login')).toBe(true)
  })

  it('🐛 REGRESSÃO — não casa com /loginsuspeito ou /registerbypass', () => {
    expect(isAuthRoute('/loginsuspeito')).toBe(false)
    expect(isAuthRoute('/registerbypass')).toBe(false)
  })

  it('aceita sub-paths legítimos', () => {
    expect(isAuthRoute('/login/callback')).toBe(true)
  })
})

describe('resolveAuthAction', () => {
  it('rota protegida + sem user → redirect /login', () => {
    expect(resolveAuthAction('/admin', false)).toEqual({ kind: 'redirect', to: '/login' })
    expect(resolveAuthAction('/dashboard', false)).toEqual({ kind: 'redirect', to: '/login' })
    expect(resolveAuthAction('/barber/schedule', false)).toEqual({ kind: 'redirect', to: '/login' })
  })

  it('rota protegida + user → passa', () => {
    expect(resolveAuthAction('/admin', true)).toEqual({ kind: 'pass' })
    expect(resolveAuthAction('/dashboard', true)).toEqual({ kind: 'pass' })
  })

  it('rota de auth + user → redirect /dashboard (UX)', () => {
    expect(resolveAuthAction('/login', true)).toEqual({ kind: 'redirect', to: '/dashboard' })
    expect(resolveAuthAction('/register', true)).toEqual({ kind: 'redirect', to: '/dashboard' })
  })

  it('rota de auth + sem user → passa', () => {
    expect(resolveAuthAction('/login', false)).toEqual({ kind: 'pass' })
    expect(resolveAuthAction('/register', false)).toEqual({ kind: 'pass' })
  })

  it('rota pública (landing) sempre passa', () => {
    expect(resolveAuthAction('/', true)).toEqual({ kind: 'pass' })
    expect(resolveAuthAction('/', false)).toEqual({ kind: 'pass' })
  })

  it('rota pública qualquer sem user → passa (não força login em landing)', () => {
    expect(resolveAuthAction('/sobre', false)).toEqual({ kind: 'pass' })
  })
})

describe('safeNextPath — proteção contra Open Redirect', () => {
  it('aceita path interno simples', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard')
    expect(safeNextPath('/admin/clients')).toBe('/admin/clients')
  })

  it('🛡️ bloqueia protocol-relative (//evil.com)', () => {
    expect(safeNextPath('//evil.com')).toBe('/dashboard')
    expect(safeNextPath('//evil.com/path')).toBe('/dashboard')
  })

  it('🛡️ bloqueia backslash protocol-relative (/\\\\evil.com — alguns browsers normalizam)', () => {
    expect(safeNextPath('/\\evil.com')).toBe('/dashboard')
  })

  it('🛡️ bloqueia URL absoluta', () => {
    expect(safeNextPath('https://evil.com')).toBe('/dashboard')
    expect(safeNextPath('http://evil.com')).toBe('/dashboard')
  })

  it('🛡️ bloqueia javascript: scheme', () => {
    expect(safeNextPath('/javascript:alert(1)')).toBe('/dashboard')
    expect(safeNextPath('javascript:alert(1)')).toBe('/dashboard')
  })

  it('bloqueia path que não começa com /', () => {
    expect(safeNextPath('dashboard')).toBe('/dashboard')
    expect(safeNextPath('../admin')).toBe('/dashboard')
  })

  it('bloqueia null/undefined/vazio com fallback', () => {
    expect(safeNextPath(null)).toBe('/dashboard')
    expect(safeNextPath(undefined)).toBe('/dashboard')
    expect(safeNextPath('')).toBe('/dashboard')
  })

  it('respeita fallback customizado', () => {
    expect(safeNextPath(null, '/wallet')).toBe('/wallet')
    expect(safeNextPath('//evil.com', '/plans')).toBe('/plans')
  })

  it('bloqueia paths com ":" (defensivo contra schemes embutidos)', () => {
    // Embora paths podem ter : (raro), preferimos bloquear como defesa em profundidade
    expect(safeNextPath('/foo:bar')).toBe('/dashboard')
  })

  it('aceita path com query string e hash', () => {
    expect(safeNextPath('/admin/clients?page=2')).toBe('/admin/clients?page=2')
    expect(safeNextPath('/dashboard#section')).toBe('/dashboard#section')
  })
})
