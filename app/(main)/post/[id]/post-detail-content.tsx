'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, EyeOff, Eye, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { VoteButtons } from '@/components/vote-buttons'
import { AnonymousBadge } from '@/components/anonymous-badge'
import { SentimentBadge } from '@/components/sentiment-badge'
import { ReportDialog } from '@/components/report-dialog'
import { CommentTree, type CommentData } from '@/components/comment-tree'
import { createClient } from '@/lib/supabase/client'
import type { VoteValue } from '@/types/database'

interface PostData {
  id: string
  title: string | null
  content: string
  is_anonymous: boolean
  sentiment: string | null
  created_at: string
  author_name?: string
  university_name?: string
  upvotes: number
  downvotes: number
  user_vote: VoteValue | null
}

interface PostDetailContentProps {
  post: PostData
  comments: CommentData[]
  userId: string
}

export function PostDetailContent({ post, comments: initialComments, userId }: PostDetailContentProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_user_id: userId,
          content: newComment.trim(),
          is_anonymous: isAnonymous,
        })
        .select('id')
        .single()

      if (error) throw error

      // Fire-and-forget moderation check
      fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          content_type: 'comment',
          content_id: comment.id,
          author_user_id: userId,
        }),
      }).catch(console.error)

      setNewComment('')
      router.refresh()
    } catch (error) {
      console.error('Comment error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button — mt-1 keeps it from being flush to the very top */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 mt-1 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to feed
      </Link>

      {/* Post */}
      <Card className="mb-5">
        <CardContent className="p-5">
          <div className="flex gap-4">
            {/* Vote Controls */}
            <VoteButtons
              targetType="post"
              targetId={post.id}
              initialUpvotes={post.upvotes}
              initialDownvotes={post.downvotes}
              initialUserVote={post.user_vote}
              layout="vertical"
            />

            {/* Post Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                {post.is_anonymous ? (
                  <AnonymousBadge />
                ) : (
                  <span className="font-semibold text-sm">{post.author_name || 'User'}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                {post.sentiment && <SentimentBadge sentiment={post.sentiment} />}
              </div>

              {/* Title */}
              {post.title && (
                <h1 className="text-xl font-display font-bold mb-2.5 text-balance leading-snug">
                  {post.title}
                </h1>
              )}

              {/* Content */}
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>

              {/* Footer */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
                {post.university_name && (
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {post.university_name}
                  </span>
                )}
                <ReportDialog targetType="post" targetId={post.id} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment Form */}
      <Card className="mb-5">
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <div className="flex items-center gap-2">
                {isAnonymous ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="comment-anonymous" className="text-sm cursor-pointer">
                  Comment anonymously
                </Label>
              </div>
              <Switch
                id="comment-anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>

            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
              className="min-h-[96px] resize-none text-sm"
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">⌘↵</kbd> to submit
              </p>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Posting…
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div>
        <h2 className="text-base font-display font-semibold mb-3">
          Comments <span className="text-muted-foreground font-normal">({comments.length})</span>
        </h2>
        <Card>
          <CardContent className="p-4">
            <CommentTree
              comments={comments}
              postId={post.id}
              onReplyPosted={() => router.refresh()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}