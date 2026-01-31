import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Keyword blacklist for instant flagging
const BLACKLIST_KEYWORDS = [
  // Add sensitive keywords here
]

// Distress indicators
const DISTRESS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'no reason to live',
  'better off dead', 'self harm', 'cut myself', 'overdose'
]

export async function POST(request: Request) {
  try {
    const { content, content_type, content_id, author_user_id } = await request.json()

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

    return NextResponse.json({
      success: true,
      result: {
        action,
        toxicity_score,
        distress_score,
        sentiment,
        sentiment_score,
        flags
      }
    })
  } catch (error: any) {
    console.error('Moderation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
