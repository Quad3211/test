import { createClient } from '@/lib/supabase/server'
import { PostCard, type PostCardData } from '@/components/post-card'
import { FileText } from 'lucide-react'

interface FeedContentProps {
  filter: string
}

interface DatabasePost {
  id: string
  title: string | null
  content: string
  is_anonymous: boolean
  sentiment: string | null
  created_at: string
  author_user_id: string
}

interface VoteCount {
  post_id: string
  upvotes: number
  downvotes: number
}

interface UserVote {
  post_id: string
  value: 'up' | 'down'
}

interface CommentCount {
  post_id: string
}

interface AuthorProfile {
  user_id: string
  name: string
}

export async function FeedContent({ filter }: FeedContentProps) {
  const supabase = await createClient()
  
  // Get current user and their university
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('university_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.university_id) return null

  // Build query based on filter
  let query = supabase
    .from('posts')
    .select('id, title, content, is_anonymous, sentiment, created_at, author_user_id')
    .eq('university_id', profile.university_id)
    .eq('status', 'active')

  // Apply sorting based on filter
  const now = new Date()
  switch (filter) {
    case 'top-24h':
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      query = query.gte('created_at', yesterday.toISOString())
      break
    case 'top-7d':
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      query = query.gte('created_at', lastWeek.toISOString())
      break
    case 'controversial':
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.limit(50)

  const { data: posts, error } = await query

  if (error) {
    console.error('Feed error:', error)
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-2">Failed to load posts</div>
        <div className="text-sm text-muted-foreground">Error: {error.message}</div>
        <div className="text-xs text-muted-foreground mt-2">Please refresh the page or contact support if this persists.</div>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">No posts yet</h3>
        <p className="text-muted-foreground">Be the first to share something with your campus!</p>
      </div>
    )
  }

  // Get vote counts and user votes for all posts
  const postIds = posts.map(p => p.id)
  
  const { data: voteCounts } = await supabase
    .from('post_vote_counts')
    .select('post_id, upvotes, downvotes')
    .in('post_id', postIds)

  const { data: userVotes } = await supabase
    .from('post_votes')
    .select('post_id, value')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  const { data: comments } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)
    .eq('status', 'active')

  // Get author names for non-anonymous posts
  const nonAnonPosts = posts.filter(p => !p.is_anonymous)
  const authorIds = [...new Set(nonAnonPosts.map(p => p.author_user_id))]
  
  const { data: authors } = await supabase
    .from('profiles')
    .select('user_id, name')
    .in('user_id', authorIds)

  // Create lookup maps with proper typing
  const voteCountMap = new Map<string, VoteCount>(
    (voteCounts || []).map(v => [v.post_id, v])
  )
  
  const userVoteMap = new Map<string, 'up' | 'down'>(
    (userVotes || []).map(v => [v.post_id, v.value])
  )
  
  const commentCountMap = new Map<string, number>()
  if (comments) {
    comments.forEach(c => {
      commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
    })
  }
  
  const authorMap = new Map<string, string>(
    (authors || []).map(a => [a.user_id, a.name])
  )

  // Transform posts for PostCard component
  const feedPosts: PostCardData[] = posts.map(post => {
    const votes = voteCountMap.get(post.id)
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      is_anonymous: post.is_anonymous,
      sentiment: post.sentiment,
      created_at: post.created_at,
      author_name: post.is_anonymous ? undefined : authorMap.get(post.author_user_id),
      upvotes: votes?.upvotes || 0,
      downvotes: votes?.downvotes || 0,
      user_vote: userVoteMap.get(post.id) || null,
      comment_count: commentCountMap.get(post.id) || 0
    }
  })

  // Sort by score for top filters
  if (filter === 'top-24h' || filter === 'top-7d') {
    feedPosts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
  } else if (filter === 'controversial') {
    // Controversial = high engagement but close votes
    feedPosts.sort((a, b) => {
      const totalA = a.upvotes + a.downvotes
      const totalB = b.upvotes + b.downvotes
      const ratioA = totalA > 0 ? Math.min(a.upvotes, a.downvotes) / totalA : 0
      const ratioB = totalB > 0 ? Math.min(b.upvotes, b.downvotes) / totalB : 0
      return (ratioB * totalB) - (ratioA * totalA)
    })
  }

  return (
    <div className="space-y-4">
      {feedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}