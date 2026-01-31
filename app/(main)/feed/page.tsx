import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { FeedContent } from './feed-content'
import { FeedFilters } from './feed-filters'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const filter = params.filter || 'newest'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Campus Feed</h1>
      </div>
      
      <FeedFilters currentFilter={filter} />
      
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <FeedContent filter={filter} />
      </Suspense>
    </div>
  )
}
