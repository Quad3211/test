import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value, ...options })
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value: '', ...options })
          } catch (error) {}
        },
      },
    }
  )

  // Refresh session so SSR pages always have a fresh token
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't need auth
  const publicRoutes = ['/auth/sign-in', '/auth/sign-up', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If no user and hitting a protected route, redirect to sign-in
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    return NextResponse.redirect(url)
  }

  // If user exists but hasn't completed onboarding, redirect there
  // (skip if they're already on onboarding or auth routes)
  if (user && !isPublicRoute && !pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.university_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/university'
      return NextResponse.redirect(url)
    }
  }

  // If user is on auth pages but already signed in with complete profile, go to feed
  if (user && (pathname === '/auth/sign-in' || pathname === '/auth/sign-up')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.university_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/feed'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}