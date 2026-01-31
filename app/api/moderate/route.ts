import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Keyword blacklist for instant flagging
const BLACKLIST_KEYWORDS: string[] = [
  // Add sensitive keywords here
]

// Distress indicators
const DISTRESS_KEYWORDS: string[] = [
  'suicide', 'kill myself', 'end it all', 'no reason to live',
  'better off dead', 'self harm', 'cut myself', 'overdose'
]

interface ModerationRequest {
  content: string
  content_type: 'post' | 'comment'
  content_id: string
  author_user_id: string
}

interface ModerationResult {
  action: 'allow' | 'hold' | 'remove'
  toxicity_score: number
  distress_score: number
  sentiment: string
  sentiment_score: number
  flags: string[]
}

export async function POST(request: Request) {
  try {
    const body: ModerationRequest = await request.json()
    const { content, content_type, content_id, author_user_id } = body

    if (!content || !content_type || !content_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const lowerContent = content.toLowerCase()
    const flags: string[] = []
    let action: 'allow' | 'hold' | 'remove' = 'allow'
    
    // Check for blacklisted keywords
    for (const keyword of BLACKLIST_KEYWORDS) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        flags.push(`blacklist:${keyword}`)
        action = 'remove'
      }
    }
    
    // Check for distress signals
    let distress_score = 0
    for (const keyword of DISTRESS_KEYWORDS) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        distress_score += 0.3
        flags.push(`distress:${keyword}`)
      }
    }
    distress_score = Math.min(distress_score, 1.0)
    
    // High distress score triggers support protocol
    if (distress_score > 0.6) {
      flags.push('high_distress')
      action = 'hold'
    }

    // Simple sentiment analysis
    let sentiment = 'neutral'
    let sentiment_score = 0.5
    
    if (lowerContent.includes('happy') || lowerContent.includes('great') || lowerContent.includes('love') || lowerContent.includes('thank')) {
      sentiment = 'positive'
      sentiment_score = 0.7
    } else if (lowerContent.includes('sad') || lowerContent.includes('angry') || lowerContent.includes('hate') || lowerContent.includes('frustrated')) {
      sentiment = 'negative'
      sentiment_score = 0.3
    }

    // Calculate toxicity based on flags
    const toxicity_score = flags.filter(f => f.startsWith('blacklist')).length > 0 ? 0.9 : 0.1

    // Determine status based on action
    const status = action === 'allow' ? 'active' : action === 'hold' ? 'flagged' : 'removed'

    // Update content with analysis results
    try {
      if (content_type === 'post') {
        await supabase
          .from('posts')
          .update({
            toxicity_score,
            distress_score,
            sentiment,
            sentiment_score,
            status
          })
          .eq('id', content_id)
      } else if (content_type === 'comment') {
        await supabase
          .from('comments')
          .update({
            toxicity_score,
            sentiment,
            sentiment_score,
            status
          })
          .eq('id', content_id)
      }

      // Create moderation log if action taken
      if (action !== 'allow') {
        await supabase
          .from('moderation_logs')
          .insert({
            action: action === 'hold' ? 'flag' : 'remove',
            target_type: content_type,
            target_id: content_id,
            performed_by: 'AI',
            reason: flags.join(', ')
          })
      }
    } catch (dbError) {
      console.error('Database error in moderation:', dbError)
      // Don't fail the whole request
    }

    const result: ModerationResult = {
      action,
      toxicity_score,
      distress_score,
      sentiment,
      sentiment_score,
      flags
    }

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error: unknown) {
    console.error('Moderation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Return success anyway to not block post creation
    return NextResponse.json({ 
      success: true,
      result: {
        action: 'allow' as const,
        toxicity_score: 0,
        distress_score: 0,
        sentiment: 'neutral',
        sentiment_score: 0.5,
        flags: [],
        error: errorMessage
      }
    })
  }
}