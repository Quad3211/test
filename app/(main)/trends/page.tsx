import { Suspense } from 'react'
import { TrendsContent } from './trends-content'
import { TrendsSkeleton } from '@/components/skeletons'

export const dynamic = 'force-dynamic'

export default async function TrendsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-display font-bold tracking-tight">Campus Trends</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          See what's being discussed across your campus
        </p>
      </div>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsContent />
      </Suspense>
    </div>
  )
}