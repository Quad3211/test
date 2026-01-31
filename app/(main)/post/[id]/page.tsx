import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostDetailContent } from './post-detail-content'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Round 1: Get post + user profile in parallel
  const [
    { data: post, error: postError },
    { data: profile },
  ] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).single(),
    supabase.from('profiles').select('university_id').eq('user_id', user.id).single(),
  ])

  if (postError || !post) notFound()
  if (!profile || profile.university_id !== post.university_id) notFound()

  // Round 2: All queries that depend on post.id but are independent of each other
  const [
    { data: university },
    { data: authorProfile },
    { data: voteCount },
    { data: userVote },
    { data: comments },
  ] = await Promise.all([
    supabase.from('universities').select('name').eq('id', post.university_id).single(),

    !post.is_anonymous
      ? supabase.from('profiles').select('name').eq('user_id', post.author_user_id).single()
      : Promise.resolve({ data: null }),

    supabase.from('post_vote_counts').select('upvotes, downvotes').eq('post_id', id).single(),

    supabase.from('post_votes').select('value').eq('post_id', id).eq('user_id', user.id).single(),

    supabase
      .from('comments')
      .select('id, content, is_anonymous, created_at, parent_comment_id, author_user_id')
      .eq('post_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
  ])

  // Round 3: Comment-dependent queries (need commentIds)
  const commentIds = comments?.map(c => c.id) || []
  const nonAnonCommentAuthorIds = [
    ...new Set((comments || []).filter(c => !c.is_anonymous).map(c => c.author_user_id))
  ]

  const [
    { data: commentVoteCounts },
    { data: userCommentVotes },
    { data: aliases },
    { data: commentAuthors },
  ] = await Promise.all([
    commentIds.length > 0
      ? supabase.from('comment_vote_counts').select('comment_id, upvotes, downvotes').in('comment_id', commentIds)
      : Promise.resolve({ data: [] }),

    commentIds.length > 0
      ? supabase.from('comment_votes').select('comment_id, value').eq('user_id', user.id).in('comment_id', commentIds)
      : Promise.resolve({ data: [] }),

    supabase.from('thread_aliases').select('user_id, alias_label').eq('post_id', id),

    nonAnonCommentAuthorIds.length > 0
      ? supabase.from('profiles').select('user_id, name').in('user_id', nonAnonCommentAuthorIds)
      : Promise.resolve({ data: [] }),
  ])

  // Build lookup maps
  const commentVoteMap = new Map((commentVoteCounts || []).map(v => [v.comment_id, v]))
  const userCommentVoteMap = new Map((userCommentVotes || []).map(v => [v.comment_id, v.value]))
  const aliasMap = new Map((aliases || []).map(a => [a.user_id, a.alias_label]))
  const commentAuthorMap = new Map((commentAuthors || []).map(a => [a.user_id, a.name]))

  const postData = {
    id: post.id,
    title: post.title,
    content: post.content,
    is_anonymous: post.is_anonymous,
    sentiment: post.sentiment,
    created_at: post.created_at,
    author_name: authorProfile?.name,
    university_name: university?.name,
    upvotes: voteCount?.upvotes || 0,
    downvotes: voteCount?.downvotes || 0,
    user_vote: userVote?.value || null,
  }

  const commentsData = (comments || []).map(comment => {
    const votes = commentVoteMap.get(comment.id)
    return {
      id: comment.id,
      content: comment.content,
      is_anonymous: comment.is_anonymous,
      created_at: comment.created_at,
      parent_comment_id: comment.parent_comment_id,
      author_name: comment.is_anonymous ? undefined : commentAuthorMap.get(comment.author_user_id),
      alias_label: comment.is_anonymous ? aliasMap.get(comment.author_user_id) : undefined,
      upvotes: votes?.upvotes || 0,
      downvotes: votes?.downvotes || 0,
      user_vote: userCommentVoteMap.get(comment.id) || null,
    }
  })

  return (
    <PostDetailContent
      post={postData}
      comments={commentsData}
      userId={user.id}
    />
  )
}