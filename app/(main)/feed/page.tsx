import { Suspense } from 'react'
import { FeedContent } from './feed-content'
import { FeedFilters } from './feed-filters'
import { FeedSkeleton } from '@/components/skeletons'

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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-display font-bold tracking-tight">Campus Feed</h1>
      </div>

      <FeedFilters currentFilter={filter} />

      <Suspense fallback={<FeedSkeleton />}>
        <FeedContent filter={filter} />
      </Suspense>
    </div>
  )
}