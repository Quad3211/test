'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { VoteButtons } from '@/components/vote-buttons'
import { AnonymousBadge } from '@/components/anonymous-badge'
import { SentimentBadge } from '@/components/sentiment-badge'
import { ReportDialog } from '@/components/report-dialog'
import { cn } from '@/lib/utils'
import type { VoteValue } from '@/types/database'

export interface PostCardData {
  id: string
  title: string | null
  content: string
  is_anonymous: boolean
  sentiment: string | null
  created_at: string
  author_name?: string
  upvotes: number
  downvotes: number
  user_vote: VoteValue | null
  comment_count: number
}

interface PostCardProps {
  post: PostCardData
  className?: string
}

export function PostCard({ post, className }: PostCardProps) {
  const excerpt = post.content.length > 200 
    ? post.content.slice(0, 200) + '...' 
    : post.content

  return (
    <Card className={cn('transition-all duration-150 hover:shadow-md', className)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Vote Controls */}
          <VoteButtons
            targetType="post"
            targetId={post.id}
            initialUpvotes={post.upvotes}
            initialDownvotes={post.downvotes}
            initialUserVote={post.user_vote}
            layout="vertical"
            className="pt-1"
          />
          
          {/* Post Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/post/${post.id}`} className="block group">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {post.is_anonymous ? (
                  <AnonymousBadge size="sm" />
                ) : (
                  <span className="text-sm font-medium">{post.author_name || 'User'}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                {post.sentiment && <SentimentBadge sentiment={post.sentiment} />}
              </div>
              
              {/* Title */}
              {post.title && (
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 text-balance">
                  {post.title}
                </h3>
              )}
              
              {/* Content excerpt */}
              <p className="text-sm text-muted-foreground line-clamp-3">
                {excerpt}
              </p>
            </Link>
            
            {/* Footer */}
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50">
              <Link 
                href={`/post/${post.id}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
              </Link>
              
              <ReportDialog targetType="post" targetId={post.id} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
