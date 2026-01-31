import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ['/feed', '/post', '/trends', '/inbox', '/settings', '/moderation', '/onboarding']
  const authRoutes = ['/auth/sign-in', '/auth/sign-up']
  
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')

  // Redirect to sign-in if not authenticated and trying to access protected route
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  // Redirect to feed if authenticated and trying to access auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  // Check if user needs to complete onboarding
  if (user && isProtectedRoute && !isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.university_id) {
      return NextResponse.redirect(new URL('/onboarding/university', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
