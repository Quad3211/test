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

  if (!profile?.university_id) {
    redirect('/onboarding/university')
  }

  if (profile.is_banned) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-display font-bold text-destructive mb-2">Account Restricted</h1>
          <p className="text-muted-foreground">
            Your account has been restricted from posting. Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  if (!profile.is_verified) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-display font-bold mb-2">Verification Required</h1>
          <p className="text-muted-foreground">
            Please verify your email address before creating posts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Composer universityId={profile.university_id} />
    </div>
  )
}
