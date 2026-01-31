import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TrendsContent } from './trends-content'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TrendsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Campus Trends</h1>
        <p className="text-muted-foreground">
          See what's being discussed across your campus
        </p>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <TrendsContent />
      </Suspense>
    </div>
  )
}
