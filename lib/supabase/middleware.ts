import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveAuthAction } from '@/lib/auth-routing'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // Sem variáveis do Supabase, não há como autenticar. Em produção isso é
  // configuração errada; em dev/build sem conexão, deixa a request passar
  // pra não quebrar SSR — layouts ainda chamam getUser() e protegem rotas.
  if (!supabaseUrl || !supabaseKey || supabaseKey.length < 20) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // getUser() valida o JWT e renova o refresh token (gravando novos cookies).
  const { data: { user } } = await supabase.auth.getUser()

  const action = resolveAuthAction(pathname, !!user)
  if (action.kind === 'redirect') {
    return NextResponse.redirect(new URL(action.to, request.url))
  }

  return supabaseResponse
}
