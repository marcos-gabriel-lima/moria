import { describe, it, expect } from 'vitest'
import {
  detectImageMimeType,
  validateImageSize,
  imageRejectionMessage,
  IMAGE_EXTENSIONS,
  MAX_IMAGE_SIZE,
  MIN_IMAGE_SIZE,
} from '@/lib/image-upload'

/** Cria um buffer com bytes hex no início + padding até `total` */
function makeBuffer(headHex: string, total = 32): Uint8Array {
  const arr = new Uint8Array(total)
  for (let i = 0; i < headHex.length; i += 2) {
    arr[i / 2] = parseInt(headHex.slice(i, i + 2), 16)
  }
  return arr
}

/** Buffer começando com magic bytes + tag textual nos bytes 8-11 (pra WebP) */
function makeRiffBuffer(tag: string): Uint8Array {
  const arr = new Uint8Array(32)
  // RIFF magic
  arr[0] = 0x52; arr[1] = 0x49; arr[2] = 0x46; arr[3] = 0x46
  // 4 bytes de tamanho (irrelevantes)
  arr[4] = 0; arr[5] = 0; arr[6] = 0; arr[7] = 0
  // tag
  arr[8] = tag.charCodeAt(0); arr[9] = tag.charCodeAt(1)
  arr[10] = tag.charCodeAt(2); arr[11] = tag.charCodeAt(3)
  return arr
}

describe('detectImageMimeType — JPEG', () => {
  it('reconhece JPEG com APP0 (ffd8ffe0)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffe0'))).toBe('image/jpeg')
  })

  it('reconhece JPEG com APP1/Exif (ffd8ffe1)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffe1'))).toBe('image/jpeg')
  })

  it('reconhece JPEG com APP2/ICC (ffd8ffe2)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffe2'))).toBe('image/jpeg')
  })

  it('reconhece JPEG sem APPn (ffd8ffdb — quantization table direto)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffdb'))).toBe('image/jpeg')
  })

  it('🐛 REGRESSÃO — reconhece JPEG ffd8ffe3 (antes era rejeitado)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffe3'))).toBe('image/jpeg')
  })

  it('🐛 REGRESSÃO — reconhece JPEG ffd8ffe8 (antes era rejeitado)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffe8'))).toBe('image/jpeg')
  })

  it('🐛 REGRESSÃO — reconhece JPEG ffd8ffee (Adobe — antes era rejeitado)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffee'))).toBe('image/jpeg')
  })
})

describe('detectImageMimeType — PNG', () => {
  it('reconhece PNG (89504e47)', () => {
    expect(detectImageMimeType(makeBuffer('89504e47'))).toBe('image/png')
  })

  it('rejeita PNG com magic bytes incompletos (apenas 3 bytes válidos)', () => {
    expect(detectImageMimeType(makeBuffer('89504e00'))).toBeNull()
  })
})

describe('detectImageMimeType — WebP', () => {
  it('reconhece WebP válido (RIFF + WEBP)', () => {
    expect(detectImageMimeType(makeRiffBuffer('WEBP'))).toBe('image/webp')
  })

  it('🛡️ rejeita RIFF com tag diferente (ex: WAVE — áudio)', () => {
    expect(detectImageMimeType(makeRiffBuffer('WAVE'))).toBeNull()
  })

  it('🛡️ rejeita RIFF com tag AVI', () => {
    expect(detectImageMimeType(makeRiffBuffer('AVI '))).toBeNull()
  })
})

describe('detectImageMimeType — defesas', () => {
  it('🛡️ rejeita SVG (XSS via JS embutido)', () => {
    // SVG começa com `<?xml` (3c3f786d6c) ou `<svg` (3c737667)
    expect(detectImageMimeType(makeBuffer('3c3f786d6c'))).toBeNull()
    expect(detectImageMimeType(makeBuffer('3c737667'))).toBeNull()
  })

  it('🛡️ rejeita HTML (<!DOCTYPE / <html)', () => {
    expect(detectImageMimeType(makeBuffer('3c21444f'))).toBeNull() // <!DO
    expect(detectImageMimeType(makeBuffer('3c68746d'))).toBeNull() // <htm
  })

  it('🛡️ rejeita PDF (25504446)', () => {
    expect(detectImageMimeType(makeBuffer('25504446'))).toBeNull()
  })

  it('🛡️ rejeita GIF (não está na whitelist)', () => {
    expect(detectImageMimeType(makeBuffer('47494638'))).toBeNull() // GIF8
  })

  it('🛡️ rejeita ZIP (504b0304)', () => {
    expect(detectImageMimeType(makeBuffer('504b0304'))).toBeNull()
  })

  it('🛡️ rejeita executável ELF', () => {
    expect(detectImageMimeType(makeBuffer('7f454c46'))).toBeNull()
  })

  it('🛡️ rejeita buffer vazio', () => {
    expect(detectImageMimeType(new Uint8Array(0))).toBeNull()
  })

  it('🛡️ rejeita buffer curto demais (< 12 bytes — protege bounds check)', () => {
    expect(detectImageMimeType(makeBuffer('ffd8ffe0', 11))).toBeNull()
  })

  it('aceita Buffer Node.js (compatibilidade)', () => {
    const buf = Buffer.from('ffd8ffe0' + '00'.repeat(28), 'hex')
    expect(detectImageMimeType(buf)).toBe('image/jpeg')
  })
})

describe('validateImageSize', () => {
  it('aceita arquivo dentro do limite', () => {
    expect(validateImageSize({ size: 500_000 })).toBeNull() // 500KB
  })

  it('🛡️ rejeita arquivo grande demais (DoS por OOM)', () => {
    expect(validateImageSize({ size: MAX_IMAGE_SIZE + 1 })).toBe('too_large')
  })

  it('🛡️ rejeita arquivo no limite exato + 1 byte', () => {
    expect(validateImageSize({ size: 5 * 1024 * 1024 + 1 })).toBe('too_large')
  })

  it('aceita arquivo no limite exato', () => {
    expect(validateImageSize({ size: MAX_IMAGE_SIZE })).toBeNull()
  })

  it('🛡️ rejeita arquivo pequeno demais (provavelmente payload, não imagem)', () => {
    expect(validateImageSize({ size: 50 })).toBe('too_small')
    expect(validateImageSize({ size: 0 })).toBe('too_small')
  })

  it('aceita arquivo no mínimo exato', () => {
    expect(validateImageSize({ size: MIN_IMAGE_SIZE })).toBeNull()
  })
})

describe('imageRejectionMessage', () => {
  it('mensagem amigável para tamanho grande', () => {
    expect(imageRejectionMessage('too_large')).toContain('5MB')
  })

  it('mensagem para tamanho pequeno', () => {
    expect(imageRejectionMessage('too_small')).toContain('pequeno')
  })

  it('mensagem para formato', () => {
    expect(imageRejectionMessage('unsupported_format')).toContain('JPEG, PNG ou WebP')
  })
})

describe('IMAGE_EXTENSIONS — sanity', () => {
  it('mapeia cada mime type pra extensão única', () => {
    expect(IMAGE_EXTENSIONS['image/jpeg']).toBe('jpg')
    expect(IMAGE_EXTENSIONS['image/png']).toBe('png')
    expect(IMAGE_EXTENSIONS['image/webp']).toBe('webp')
  })

  it('extensões não contêm caracteres de path traversal', () => {
    Object.values(IMAGE_EXTENSIONS).forEach(ext => {
      expect(ext).not.toContain('/')
      expect(ext).not.toContain('\\')
      expect(ext).not.toContain('.')
    })
  })
})
