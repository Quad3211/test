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

  // Get post with author info
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    console.error('Post fetch error:', error)
    notFound()
  }

  // Check user has access (same university)
  const { data: profile } = await supabase
    .from('profiles')
    .select('university_id')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.university_id !== post.university_id) {
    notFound()
  }

  // Get university name
  const { data: university } = await supabase
    .from('universities')
    .select('name')
    .eq('id', post.university_id)
    .single()

  // Get author name if not anonymous
  let authorName: string | undefined
  if (!post.is_anonymous) {
    const { data: author } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', post.author_user_id)
      .single()
    authorName = author?.name
  }

  // Get vote counts
  const { data: voteCount } = await supabase
    .from('post_vote_counts')
    .select('upvotes, downvotes')
    .eq('post_id', id)
    .single()

  // Get user's vote
  const { data: userVote } = await supabase
    .from('post_votes')
    .select('value')
    .eq('post_id', id)
    .eq('user_id', user.id)
    .single()

  // Get comments with vote info
  const { data: comments } = await supabase
    .from('comments')
    .select('id, content, is_anonymous, created_at, parent_comment_id, author_user_id')
    .eq('post_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  // Get comment votes
  const commentIds = comments?.map(c => c.id) || []
  
  const { data: commentVoteCounts } = await supabase
    .from('comment_vote_counts')
    .select('comment_id, upvotes, downvotes')
    .in('comment_id', commentIds)

  const { data: userCommentVotes } = await supabase
    .from('comment_votes')
    .select('comment_id, value')
    .eq('user_id', user.id)
    .in('comment_id', commentIds)

  // Get thread aliases for anonymous users
  const { data: aliases } = await supabase
    .from('thread_aliases')
    .select('user_id, alias_label')
    .eq('post_id', id)

  // Get author names for non-anonymous comments
  const nonAnonComments = comments?.filter(c => !c.is_anonymous) || []
  const commentAuthorIds = [...new Set(nonAnonComments.map(c => c.author_user_id))]
  
  const { data: commentAuthors } = await supabase
    .from('profiles')
    .select('user_id, name')
    .in('user_id', commentAuthorIds)

  // Create lookup maps
  const commentVoteMap = new Map(commentVoteCounts?.map(v => [v.comment_id, v]) || [])
  const userCommentVoteMap = new Map(userCommentVotes?.map(v => [v.comment_id, v.value]) || [])
  const aliasMap = new Map(aliases?.map(a => [a.user_id, a.alias_label]) || [])
  const commentAuthorMap = new Map(commentAuthors?.map(a => [a.user_id, a.name]) || [])

  // Transform post data
  const postData = {
    id: post.id,
    title: post.title,
    content: post.content,
    is_anonymous: post.is_anonymous,
    sentiment: post.sentiment,
    created_at: post.created_at,
    author_name: authorName,
    university_name: university?.name,
    upvotes: voteCount?.upvotes || 0,
    downvotes: voteCount?.downvotes || 0,
    user_vote: userVote?.value || null,
  }

  // Transform comments data
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