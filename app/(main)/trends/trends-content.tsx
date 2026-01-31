import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Hash, Smile, Meh, Frown, BarChart3, MessageSquare, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export async function TrendsContent() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('university_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.university_id) return null

  // Get trending keywords for university
  const { data: keywords } = await supabase
    .from('trends')
    .select('keyword, frequency')
    .eq('university_id', profile.university_id)
    .order('frequency', { ascending: false })
    .limit(10)

  // Get national trends (university_id is null)
  const { data: nationalKeywords } = await supabase
    .from('trends')
    .select('keyword, frequency')
    .is('university_id', null)
    .order('frequency', { ascending: false })
    .limit(10)

  // Get top posts this week
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const { data: topPosts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      created_at,
      is_anonymous
    `)
    .eq('university_id', profile.university_id)
    .eq('status', 'active')
    .gte('created_at', lastWeek.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  // Get post IDs for vote counts
  const postIds = topPosts?.map(p => p.id) || []
  
  const { data: voteCounts } = await supabase
    .from('post_vote_counts')
    .select('post_id, upvotes, downvotes, score')
    .in('post_id', postIds)

  const voteMap = new Map(voteCounts?.map(v => [v.post_id, v]) || [])

  // Sort posts by score
  const sortedPosts = topPosts?.map(post => ({
    ...post,
    score: voteMap.get(post.id)?.score || 0,
    upvotes: voteMap.get(post.id)?.upvotes || 0,
  })).sort((a, b) => b.score - a.score).slice(0, 5) || []

  // Calculate mood meter from recent posts' sentiment
  const { data: sentimentData } = await supabase
    .from('posts')
    .select('sentiment')
    .eq('university_id', profile.university_id)
    .eq('status', 'active')
    .gte('created_at', lastWeek.toISOString())

  const sentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  }

  sentimentData?.forEach(post => {
    if (post.sentiment && post.sentiment in sentimentCounts) {
      sentimentCounts[post.sentiment as keyof typeof sentimentCounts]++
    }
  })

  const totalSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative
  const moodScore = totalSentiment > 0
    ? Math.round(((sentimentCounts.positive * 100) + (sentimentCounts.neutral * 50)) / totalSentiment)
    : 50

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Mood Meter */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <BarChart3 className="h-5 w-5 text-primary" />
            Campus Mood This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Mood indicator */}
            <div className="flex items-center gap-3">
              {moodScore >= 60 ? (
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <Smile className="h-8 w-8 text-success" />
                </div>
              ) : moodScore >= 40 ? (
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                  <Meh className="h-8 w-8 text-warning" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Frown className="h-8 w-8 text-destructive" />
                </div>
              )}
              <div>
                <div className="text-3xl font-bold">{moodScore}%</div>
                <div className="text-sm text-muted-foreground">Positivity Score</div>
              </div>
            </div>

            {/* Sentiment breakdown */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-muted-foreground">Positive</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: totalSentiment > 0 ? `${(sentimentCounts.positive / totalSentiment) * 100}%` : '0%' }}
                  />
                </div>
                <div className="w-10 text-sm text-right">{sentimentCounts.positive}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-muted-foreground">Neutral</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-warning rounded-full transition-all"
                    style={{ width: totalSentiment > 0 ? `${(sentimentCounts.neutral / totalSentiment) * 100}%` : '0%' }}
                  />
                </div>
                <div className="w-10 text-sm text-right">{sentimentCounts.neutral}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-muted-foreground">Negative</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive rounded-full transition-all"
                    style={{ width: totalSentiment > 0 ? `${(sentimentCounts.negative / totalSentiment) * 100}%` : '0%' }}
                  />
                </div>
                <div className="w-10 text-sm text-right">{sentimentCounts.negative}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campus Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Hash className="h-5 w-5 text-primary" />
            Trending on Campus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywords && keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((trend, index) => (
                <span 
                  key={trend.keyword}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
                >
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  {trend.keyword}
                  <span className="text-xs text-muted-foreground">({trend.frequency})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trending topics yet. Start discussions to see trends!
            </p>
          )}
        </CardContent>
      </Card>

      {/* National Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <TrendingUp className="h-5 w-5 text-accent" />
            National Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nationalKeywords && nationalKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {nationalKeywords.map((trend, index) => (
                <span 
                  key={trend.keyword}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-sm font-medium"
                >
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  {trend.keyword}
                  <span className="text-xs text-muted-foreground">({trend.frequency})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No national trends available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <MessageSquare className="h-5 w-5 text-primary" />
            Top Posts This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPosts.length > 0 ? (
            <div className="space-y-3">
              {sortedPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {post.title || post.content.slice(0, 60) + (post.content.length > 60 ? '...' : '')}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.upvotes} upvotes
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No posts this week yet. Be the first to share!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
