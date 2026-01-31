import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('university_id')
          .eq('user_id', user.id)
          .single()

        // If no profile or no university yet, go to onboarding
        if (!profile?.university_id) {
          return NextResponse.redirect(new URL('/onboarding/university', origin))
        }
      }

      // Fully onboarded — go straight to feed
      return NextResponse.redirect(new URL('/feed', origin))
    }
  }

  // Exchange failed or no code — back to sign-in
  return NextResponse.redirect(new URL('/auth/sign-in', origin))
}