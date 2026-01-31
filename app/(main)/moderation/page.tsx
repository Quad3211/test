import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModerationDashboard } from './moderation-dashboard'

export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Check if user is moderator or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, university_id')
    .eq('user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'moderator' && profile.role !== 'admin')) {
    redirect('/feed')
  }

  // Get flagged content
  const { data: flaggedPosts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      status,
      created_at,
      toxicity_score,
      distress_score,
      author_user_id,
      profiles!posts_author_user_id_fkey(name, user_id)
    `)
    .eq('university_id', profile.university_id)
    .eq('status', 'flagged')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get pending reports
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id,
      reason,
      details,
      status,
      created_at,
      target_type,
      target_id
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get recent moderation logs
  const { data: logs } = await supabase
    .from('moderation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <ModerationDashboard
      flaggedPosts={flaggedPosts || []}
      reports={reports || []}
      logs={logs || []}
      universityId={profile.university_id!}
    />
  )
}
