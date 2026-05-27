import { describe, it, expect } from 'vitest'
import { escapeHtml, safeHref } from '@/lib/html-escape'

describe('escapeHtml — escape básico', () => {
  it('escapa `<` e `>`', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapa `&` antes dos outros (evita double-escape)', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapa aspas duplas (importante pra atributos HTML)', () => {
    expect(escapeHtml('Diz "Olá"')).toBe('Diz &quot;Olá&quot;')
  })

  it('escapa aspas simples', () => {
    expect(escapeHtml("d'Artagnan")).toBe('d&#39;Artagnan')
  })

  it('aceita caracteres unicode (acentos, emojis)', () => {
    expect(escapeHtml('João 👨‍🦱')).toBe('João 👨‍🦱')
  })
})

describe('escapeHtml — vetores de XSS comuns', () => {
  it('🛡️ <script> inline', () => {
    const out = escapeHtml('<script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;')
  })

  it('🛡️ <img onerror>', () => {
    const out = escapeHtml('<img src=x onerror="alert(1)">')
    expect(out).not.toContain('<img')
  })

  it('🛡️ atributo quebrado por aspa', () => {
    // Atacante põe `" onmouseover=alert(1) "` esperando quebrar atributo
    const out = escapeHtml('" onmouseover="alert(1)" "')
    expect(out).not.toContain('"')
    expect(out).toContain('&quot;')
  })

  it('🛡️ HTML entity disfarçado', () => {
    // Já vem escapado — não vamos decode, escapamos de novo (idempotente seguro)
    const out = escapeHtml('&lt;script&gt;')
    expect(out).toBe('&amp;lt;script&amp;gt;')
  })

  it('🛡️ template literal interpolação', () => {
    const name = '${alert(1)}'
    expect(escapeHtml(name)).toBe('${alert(1)}') // backticks/dollar não são HTML
  })
})

describe('escapeHtml — edge cases', () => {
  it('null vira string vazia', () => {
    expect(escapeHtml(null)).toBe('')
  })

  it('undefined vira string vazia', () => {
    expect(escapeHtml(undefined)).toBe('')
  })

  it('número é coerced pra string', () => {
    expect(escapeHtml(42)).toBe('42')
  })

  it('boolean é coerced pra string', () => {
    expect(escapeHtml(true)).toBe('true')
  })

  it('objeto vira "[object Object]" (sanity, não vaza)', () => {
    expect(escapeHtml({ a: 1 })).toBe('[object Object]')
  })

  it('string vazia retorna string vazia', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('safeHref — valida URL pra href', () => {
  it('aceita HTTPS', () => {
    expect(safeHref('https://moria.app')).toBe('https://moria.app')
  })

  it('aceita HTTP', () => {
    expect(safeHref('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('aceita mailto', () => {
    expect(safeHref('mailto:joao@example.com')).toBe('mailto:joao@example.com')
  })

  it('aceita tel', () => {
    expect(safeHref('tel:+5511999998888')).toBe('tel:+5511999998888')
  })

  it('🛡️ rejeita javascript: (XSS clássico)', () => {
    expect(safeHref('javascript:alert(1)')).toBe(null)
    expect(safeHref('JavaScript:alert(1)')).toBe(null)
    expect(safeHref('JAVASCRIPT:alert(1)')).toBe(null)
  })

  it('🛡️ rejeita data: URI', () => {
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBe(null)
  })

  it('🛡️ rejeita file://', () => {
    expect(safeHref('file:///etc/passwd')).toBe(null)
  })

  it('🛡️ rejeita vbscript', () => {
    expect(safeHref('vbscript:msgbox(1)')).toBe(null)
  })

  it('🛡️ rejeita URL com aspas', () => {
    expect(safeHref('https://moria.app" onclick="alert(1)')).toBe(null)
  })

  it('🛡️ rejeita URL com espaços', () => {
    expect(safeHref('https://moria.app /path')).toBe(null)
  })

  it('🛡️ rejeita URL com control chars', () => {
    expect(safeHref('https://moria.app\n')).toBe(null)
  })

  it('🛡️ rejeita path relativo (sem scheme)', () => {
    expect(safeHref('/path')).toBe(null)
    expect(safeHref('moria.app')).toBe(null)
  })

  it('🛡️ rejeita strings vazias e tipos não-string', () => {
    expect(safeHref('')).toBe(null)
    expect(safeHref(null)).toBe(null)
    expect(safeHref(undefined)).toBe(null)
    expect(safeHref(42)).toBe(null)
  })

  it('🛡️ rejeita URLs absurdamente longas (proteção DoS)', () => {
    expect(safeHref('https://moria.app/' + 'a'.repeat(3000))).toBe(null)
  })

  it('aceita URLs comuns do Supabase recovery', () => {
    const supabaseRecovery = 'https://ujpcttmjbkiuuimeptvr.supabase.co/auth/v1/verify?token=abc123&type=recovery&redirect_to=https%3A%2F%2Fmoria.app%2F'
    expect(safeHref(supabaseRecovery)).toBe(supabaseRecovery)
  })
})
