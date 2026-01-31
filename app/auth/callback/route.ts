import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('university_id')
          .eq('user_id', user.id)
          .single()
        
        // Redirect to onboarding if no university selected
        if (!profile?.university_id) {
          return NextResponse.redirect(new URL('/onboarding/university', requestUrl.origin))
        }
      }
      
      return NextResponse.redirect(new URL('/feed', requestUrl.origin))
    }
  }

  // Return to sign-in on error
  return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin))
}
