'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, MessageSquare, CornerDownRight } from 'lucide-react'
import { VoteButtons } from '@/components/vote-buttons'
import { AnonymousBadge } from '@/components/anonymous-badge'
import { ReportDialog } from '@/components/report-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { VoteValue } from '@/types/database'

export interface CommentData {
  id: string
  content: string
  is_anonymous: boolean
  created_at: string
  author_name?: string
  alias_label?: string
  upvotes: number
  downvotes: number
  user_vote: VoteValue | null
  parent_comment_id: string | null
  replies?: CommentData[]
}

interface CommentProps {
  comment: CommentData
  postId: string
  depth?: number
  onReplyPosted?: () => void
}

function Comment({ comment, postId, depth = 0, onReplyPosted }: CommentProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  
  const maxDepth = 4
  const hasReplies = comment.replies && comment.replies.length > 0

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return
    
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: comment.id,
          author_user_id: user.id,
          content: replyContent.trim(),
          is_anonymous: true, // Default to anonymous
        })
        .select('id')
        .single()

      if (error) throw error

      // Trigger moderation
      fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          content_type: 'comment',
          content_id: newComment.id,
          author_user_id: user.id
        })
      }).catch(console.error)

      setReplyContent('')
      setShowReplyForm(false)
      onReplyPosted?.()
    } catch (error) {
      console.error('Reply error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn(depth > 0 && 'ml-4 pl-4 border-l-2 border-border')}>
      <div className="py-3">
        <div className="flex gap-3">
          {/* Vote Controls */}
          <VoteButtons
            targetType="comment"
            targetId={comment.id}
            initialUpvotes={comment.upvotes}
            initialDownvotes={comment.downvotes}
            initialUserVote={comment.user_vote}
            layout="vertical"
            className="pt-0.5"
          />
          
          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {comment.is_anonymous ? (
                <AnonymousBadge alias={comment.alias_label} size="sm" />
              ) : (
                <span className="text-sm font-medium">{comment.author_name || 'User'}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {/* Content */}
            {!collapsed && (
              <>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                
                {/* Actions */}
                <div className="flex items-center gap-3 mt-2">
                  {depth < maxDepth && (
                    <button
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CornerDownRight className="h-3 w-3" />
                      Reply
                    </button>
                  )}
                  <ReportDialog 
                    targetType="comment" 
                    targetId={comment.id}
                    trigger={
                      <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                        Report
                      </button>
                    }
                  />
                  {hasReplies && (
                    <button
                      onClick={() => setCollapsed(!collapsed)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {collapsed ? (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                        </>
                      ) : (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Hide replies
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {showReplyForm && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] text-sm"
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim() || isSubmitting}
                      >
                        {isSubmitting ? 'Posting...' : 'Reply'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowReplyForm(false)
                          setReplyContent('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {collapsed && hasReplies && (
              <button
                onClick={() => setCollapsed(false)}
                className="text-xs text-primary hover:underline"
              >
                Show collapsed content
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Nested Replies */}
      {!collapsed && hasReplies && (
        <div>
          {comment.replies!.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onReplyPosted={onReplyPosted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentTreeProps {
  comments: CommentData[]
  postId: string
  onReplyPosted?: () => void
}

export function CommentTree({ comments, postId, onReplyPosted }: CommentTreeProps) {
  // Build tree structure from flat comments
  const buildTree = (items: CommentData[]): CommentData[] => {
    const map = new Map<string, CommentData>()
    const roots: CommentData[] = []
    
    // First pass: create map
    items.forEach(item => {
      map.set(item.id, { ...item, replies: [] })
    })
    
    // Second pass: build tree
    items.forEach(item => {
      const node = map.get(item.id)!
      if (item.parent_comment_id) {
        const parent = map.get(item.parent_comment_id)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(node)
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })
    
    return roots
  }
  
  const tree = buildTree(comments)
  
  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {tree.map((comment) => (
        <Comment 
          key={comment.id} 
          comment={comment} 
          postId={postId}
          onReplyPosted={onReplyPosted}
        />
      ))}
    </div>
  )
}
