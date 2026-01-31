import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Composer } from '@/components/composer'

export default async function NewPostPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('university_id, is_verified, is_banned')
    .eq('user_id', user.id)
    .single()

  // Middleware should catch this, but belt-and-suspenders
  if (!profile?.university_id) {
    redirect('/onboarding/university')
  }

  if (profile.is_banned) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-lg font-display font-bold text-destructive mb-1.5">Account Restricted</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your account has been restricted from posting. Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  if (!profile.is_verified) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="text-lg font-display font-bold mb-1.5">Verification Required</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Please verify your email address before creating posts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold tracking-tight mb-5">New Post</h1>
      <Composer universityId={profile.university_id} />
    </div>
  )
}