// Detecção e validação de imagens — funções puras, sem dependência de Supabase.

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number]

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB — alinhado com bodySizeLimit do Next
export const MIN_IMAGE_SIZE = 100             // <100 bytes não é uma imagem real, é payload suspeito

export const IMAGE_EXTENSIONS: Record<ImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

/**
 * JPEG magic bytes — JPEGs começam com `FF D8 FF` seguido de qualquer marker
 * APPn (`E0` a `EF`) ou outros markers válidos. Como a lista completa varia,
 * verificamos o prefixo de 3 bytes pra cobrir todos os casos legítimos.
 */
const JPEG_PREFIX = 'ffd8ff'
const PNG_MAGIC   = '89504e47'
const RIFF_MAGIC  = '52494646'
const WEBP_TAG    = 'WEBP'

/**
 * Detecta o MIME type de uma imagem inspecionando bytes iniciais ("magic bytes").
 *
 * Por que NÃO confiar em `file.type`:
 *   - Vem do client e pode ser forjado (curl, JS manipulado).
 *   - Atacante pode subir um .html ou .svg com `type: 'image/jpeg'`.
 *
 * Aceita JPEG, PNG e WebP. Rejeita tudo o resto (incluindo SVG por causa de
 * XSS via JS embutido).
 */
export function detectImageMimeType(buffer: Uint8Array | Buffer): ImageMimeType | null {
  if (buffer.length < 12) return null
  const head4 = bufferToHex(buffer, 0, 4)
  if (head4.startsWith(JPEG_PREFIX)) return 'image/jpeg'
  if (head4 === PNG_MAGIC) return 'image/png'
  if (head4 === RIFF_MAGIC) {
    // WebP: bytes 8-11 devem ser "WEBP"
    const tag = String.fromCharCode(buffer[8]!, buffer[9]!, buffer[10]!, buffer[11]!)
    return tag === WEBP_TAG ? 'image/webp' : null
  }
  return null
}

function bufferToHex(b: Uint8Array | Buffer, start: number, end: number): string {
  let s = ''
  for (let i = start; i < end && i < b.length; i++) {
    s += b[i]!.toString(16).padStart(2, '0')
  }
  return s
}

export type ImageRejectionReason = 'too_small' | 'too_large' | 'unsupported_format'

/**
 * Valida o tamanho do arquivo SEM carregá-lo na memória.
 *
 * Os checks de tamanho rodam contra `file.size` (lazy — não chama arrayBuffer
 * antes), evitando OOM em uploads grandes.
 *
 * Retorna `null` se OK, ou o motivo de rejeição.
 */
export function validateImageSize(file: { size: number }): ImageRejectionReason | null {
  if (file.size < MIN_IMAGE_SIZE) return 'too_small'
  if (file.size > MAX_IMAGE_SIZE) return 'too_large'
  return null
}

/**
 * Mensagens amigáveis pra cada motivo de rejeição.
 */
export function imageRejectionMessage(reason: ImageRejectionReason): string {
  switch (reason) {
    case 'too_small':         return 'Arquivo muito pequeno. Verifique se a imagem está íntegra.'
    case 'too_large':         return `Arquivo muito grande. Máximo ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`
    case 'unsupported_format':return 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'
  }
}
