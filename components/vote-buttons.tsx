'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { VoteValue } from '@/types/database'

interface VoteButtonsProps {
  targetType: 'post' | 'comment'
  targetId: string
  initialUpvotes: number
  initialDownvotes: number
  initialUserVote: VoteValue | null
  className?: string
  layout?: 'vertical' | 'horizontal'
}

type OptimisticState = {
  upvotes: number
  downvotes: number
  userVote: VoteValue | null
}

export function VoteButtons({
  targetType,
  targetId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  className,
  layout = 'vertical'
}: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()
  
  const [state, setState] = useState<OptimisticState>({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    userVote: initialUserVote
  })

  const [optimisticState, setOptimisticState] = useOptimistic(
    state,
    (currentState: OptimisticState, newVote: VoteValue | null) => {
      const prevVote = currentState.userVote
      let upvotes = currentState.upvotes
      let downvotes = currentState.downvotes
      
      // Remove previous vote effect
      if (prevVote === 'up') upvotes--
      if (prevVote === 'down') downvotes--
      
      // Add new vote effect
      if (newVote === 'up') upvotes++
      if (newVote === 'down') downvotes++
      
      return { upvotes, downvotes, userVote: newVote }
    }
  )
  
  const score = optimisticState.upvotes - optimisticState.downvotes
  
  const handleVote = async (value: VoteValue) => {
    const newVote = optimisticState.userVote === value ? null : value
    
    startTransition(async () => {
      setOptimisticState(newVote)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const table = targetType === 'post' ? 'post_votes' : 'comment_votes'
        const idColumn = targetType === 'post' ? 'post_id' : 'comment_id'
        
        if (newVote === null) {
          // Remove vote
          await supabase
            .from(table)
            .delete()
            .eq(idColumn, targetId)
            .eq('user_id', user.id)
        } else if (optimisticState.userVote) {
          // Update existing vote
          await supabase
            .from(table)
            .update({ value: newVote })
            .eq(idColumn, targetId)
            .eq('user_id', user.id)
        } else {
          // Insert new vote
          await supabase
            .from(table)
            .insert({
              [idColumn]: targetId,
              user_id: user.id,
              value: newVote
            })
        }
        
        // Update real state after successful operation
        setState(prev => {
          let upvotes = prev.upvotes
          let downvotes = prev.downvotes
          
          if (prev.userVote === 'up') upvotes--
          if (prev.userVote === 'down') downvotes--
          if (newVote === 'up') upvotes++
          if (newVote === 'down') downvotes++
          
          return { upvotes, downvotes, userVote: newVote }
        })
      } catch (error) {
        console.error('Vote error:', error)
        // Optimistic state will rollback on next render
      }
    })
  }
  
  return (
    <div 
      className={cn(
        'flex items-center gap-1',
        layout === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
    >
      <button
        onClick={() => handleVote('up')}
        disabled={isPending}
        aria-label="Upvote"
        className={cn(
          'p-1 rounded-lg transition-colors hover:bg-muted',
          optimisticState.userVote === 'up' 
            ? 'text-primary' 
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <ArrowBigUp className={cn(
          'h-6 w-6',
          optimisticState.userVote === 'up' && 'fill-primary'
        )} />
      </button>
      
      <span className={cn(
        'font-semibold text-sm tabular-nums min-w-[2ch] text-center',
        score > 0 && 'text-primary',
        score < 0 && 'text-destructive'
      )}>
        {score}
      </span>
      
      <button
        onClick={() => handleVote('down')}
        disabled={isPending}
        aria-label="Downvote"
        className={cn(
          'p-1 rounded-lg transition-colors hover:bg-muted',
          optimisticState.userVote === 'down' 
            ? 'text-destructive' 
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <ArrowBigDown className={cn(
          'h-6 w-6',
          optimisticState.userVote === 'down' && 'fill-destructive'
        )} />
      </button>
    </div>
  )
}
