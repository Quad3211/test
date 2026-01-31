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

  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // ─── PARALLELIZED: all independent queries fire at once ───
  const [
    { data: keywords },
    { data: nationalKeywords },
    { data: topPosts },
    { data: sentimentData },
  ] = await Promise.all([
    supabase
      .from('trends')
      .select('keyword, frequency')
      .eq('university_id', profile.university_id)
      .order('frequency', { ascending: false })
      .limit(10),

    supabase
      .from('trends')
      .select('keyword, frequency')
      .is('university_id', null)
      .order('frequency', { ascending: false })
      .limit(10),

    supabase
      .from('posts')
      .select('id, title, content, created_at, is_anonymous')
      .eq('university_id', profile.university_id)
      .eq('status', 'active')
      .gte('created_at', lastWeek.toISOString())
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('posts')
      .select('sentiment')
      .eq('university_id', profile.university_id)
      .eq('status', 'active')
      .gte('created_at', lastWeek.toISOString()),
  ])

  // Round 2: vote counts for top posts (needs postIds from round 1)
  const postIds = topPosts?.map(p => p.id) || []
  const { data: voteCounts } = postIds.length > 0
    ? await supabase
        .from('post_vote_counts')
        .select('post_id, upvotes, downvotes, score')
        .in('post_id', postIds)
    : { data: [] }

  const voteMap = new Map((voteCounts || []).map(v => [v.post_id, v]))

  const sortedPosts = (topPosts || [])
    .map(post => ({
      ...post,
      score: voteMap.get(post.id)?.score || 0,
      upvotes: voteMap.get(post.id)?.upvotes || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // Sentiment calculations
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  ;(sentimentData || []).forEach(post => {
    if (post.sentiment && post.sentiment in sentimentCounts) {
      sentimentCounts[post.sentiment as keyof typeof sentimentCounts]++
    }
  })

  const totalSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative
  const moodScore = totalSentiment > 0
    ? Math.round(((sentimentCounts.positive * 100) + (sentimentCounts.neutral * 50)) / totalSentiment)
    : 50

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Mood Meter */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
            Campus Mood This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              {moodScore >= 60 ? (
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Smile className="h-7 w-7 text-success" />
                </div>
              ) : moodScore >= 40 ? (
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                  <Meh className="h-7 w-7 text-warning" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <Frown className="h-7 w-7 text-destructive" />
                </div>
              )}
              <div>
                <div className="text-2xl font-bold tabular-nums">{moodScore}%</div>
                <div className="text-xs text-muted-foreground">Positivity</div>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {[
                { label: 'Positive', count: sentimentCounts.positive, color: 'bg-success' },
                { label: 'Neutral', count: sentimentCounts.neutral, color: 'bg-warning' },
                { label: 'Negative', count: sentimentCounts.negative, color: 'bg-destructive' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-16 text-xs text-muted-foreground">{label}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: totalSentiment > 0 ? `${(count / totalSentiment) * 100}%` : '0%' }}
                    />
                  </div>
                  <div className="w-7 text-xs text-right text-muted-foreground tabular-nums">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campus Keywords */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Hash className="h-4.5 w-4.5 text-primary" />
            Trending on Campus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywords && keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((trend, index) => (
                <span
                  key={trend.keyword}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm"
                >
                  <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                  <span className="font-medium">{trend.keyword}</span>
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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <TrendingUp className="h-4.5 w-4.5 text-accent" />
            National Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nationalKeywords && nationalKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {nationalKeywords.map((trend, index) => (
                <span
                  key={trend.keyword}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-sm"
                >
                  <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                  <span className="font-medium">{trend.keyword}</span>
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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <MessageSquare className="h-4.5 w-4.5 text-primary" />
            Top Posts This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPosts.length > 0 ? (
            <div className="space-y-1">
              {sortedPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {post.title || post.content.slice(0, 60) + (post.content.length > 60 ? '…' : '')}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.upvotes}
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