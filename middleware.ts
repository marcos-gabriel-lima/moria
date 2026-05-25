import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Exclui assets do Next, ícones/imagens, manifest e a rota /api
    // (handlers em /api/* fazem auth próprio quando necessário).
    '/((?!api|_next/static|_next/image|favicon\\.ico|icons|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
