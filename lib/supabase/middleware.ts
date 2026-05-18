import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // Bypass only in non-production when Supabase is not configured (e.g. CI, local demo)
  if (process.env.NODE_ENV !== 'production' && (!supabaseUrl || !supabaseKey || supabaseKey.length < 20)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const adminRoutes  = ['/admin']
  const barberRoutes = ['/barber']
  const clientRoutes = ['/dashboard', '/appointments', '/plans', '/wallet', '/products']
  const authRoutes   = ['/login', '/register']

  if (!user) {
    if ([...adminRoutes, ...barberRoutes, ...clientRoutes].some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  const needsRoleCheck =
    authRoutes.some(r => pathname.startsWith(r)) ||
    adminRoutes.some(r => pathname.startsWith(r)) ||
    barberRoutes.some(r => pathname.startsWith(r))

  if (needsRoleCheck) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'client'

    if (authRoutes.some(r => pathname.startsWith(r))) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (role === 'barber') return NextResponse.redirect(new URL('/barber/schedule', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (adminRoutes.some(r => pathname.startsWith(r)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (barberRoutes.some(r => pathname.startsWith(r)) && !['barber', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}
