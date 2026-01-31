// OmniCampus - Content Moderation Edge Function
// This function analyzes content for toxicity, sentiment, and distress signals

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  reason?: string
}

// Keyword blacklist for instant flagging
const BLACKLIST_KEYWORDS = [
  // Add sensitive keywords here
  // Example categories:
  // - Doxxing patterns: phone numbers, addresses
  // - Extreme profanity
  // - Threats of violence
  // - Self-harm indicators
]

// Distress indicators
const DISTRESS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'no reason to live',
  'better off dead', 'self harm', 'cut myself', 'overdose'
]

async function analyzeContent(content: string): Promise<ModerationResult> {
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
    action = 'hold' // Hold for review but also trigger support bot
  }
  
  // TODO: Call AI provider for sophisticated analysis
  // Example with OpenAI Moderation API:
  /*
  const AI_API_KEY = Deno.env.get('AI_PROVIDER_API_KEY')
  
  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: content })
  })
  
  const moderation = await response.json()
  const results = moderation.results[0]
  
  // Check categories
  if (results.categories.hate) flags.push('hate_speech')
  if (results.categories.harassment) flags.push('harassment')
  if (results.categories['self-harm']) {
    flags.push('self_harm')
    distress_score = Math.max(distress_score, 0.8)
  }
  if (results.categories.violence) flags.push('violence')
  
  // Calculate toxicity score
  const toxicity_score = Math.max(
    results.category_scores.hate,
    results.category_scores.harassment,
    results.category_scores.violence
  )
  */
  
  // Placeholder scores (replace with real AI analysis)
  const toxicity_score = flags.filter(f => f.startsWith('blacklist')).length > 0 ? 0.9 : 0.1
  
  // Simple sentiment analysis (replace with real AI)
  let sentiment = 'neutral'
  let sentiment_score = 0.5
  
  if (lowerContent.includes('happy') || lowerContent.includes('great') || lowerContent.includes('love')) {
    sentiment = 'positive'
    sentiment_score = 0.7
  } else if (lowerContent.includes('sad') || lowerContent.includes('angry') || lowerContent.includes('hate')) {
    sentiment = 'negative'
    sentiment_score = 0.3
  }
  
  // Determine action based on scores
  if (toxicity_score > 0.8 && action !== 'remove') {
    action = 'hold'
    flags.push('high_toxicity')
  }
  
  return {
    action,
    toxicity_score,
    distress_score,
    sentiment,
    sentiment_score,
    flags,
    reason: flags.length > 0 ? flags.join(', ') : undefined
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { content, content_type, content_id, author_user_id }: ModerationRequest = await req.json()

    if (!content || !content_type || !content_id) {
      throw new Error('Missing required fields')
    }

    // Analyze content
    const result = await analyzeContent(content)

    // Update content with analysis results
    if (content_type === 'post') {
      await supabaseClient
        .from('posts')
        .update({
          toxicity_score: result.toxicity_score,
          distress_score: result.distress_score,
          sentiment: result.sentiment,
          sentiment_score: result.sentiment_score,
          status: result.action === 'allow' ? 'active' : result.action === 'hold' ? 'flagged' : 'removed'
        })
        .eq('id', content_id)
    } else {
      await supabaseClient
        .from('comments')
        .update({
          toxicity_score: result.toxicity_score,
          sentiment: result.sentiment,
          sentiment_score: result.sentiment_score,
          status: result.action === 'allow' ? 'active' : result.action === 'hold' ? 'flagged' : 'removed'
        })
        .eq('id', content_id)
    }

    // Create moderation log
    if (result.action !== 'allow') {
      await supabaseClient
        .from('moderation_logs')
        .insert({
          action: result.action === 'hold' ? 'flag' : 'remove',
          target_type: content_type,
          target_id: content_id,
          performed_by: 'AI',
          reason: result.reason
        })
    }

    // Trigger support bot if high distress
    if (result.distress_score > 0.6) {
      // TODO: Send system message to user's inbox
      console.log(`High distress detected for user ${author_user_id}, triggering support protocol`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in moderate_text function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
