import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Em Next.js 16, `middleware.ts` foi renomeado pra `proxy.ts`.
// Mantemos a lógica em `lib/supabase/middleware.ts` por convenção do Supabase.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Exclui assets do Next, ícones/imagens, manifest e a rota /api
    // (handlers em /api/* fazem auth próprio quando necessário — ex: cron-secret).
    '/((?!api|_next/static|_next/image|favicon\\.ico|icons|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
