'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const filters = [
  { value: 'newest', label: 'Newest' },
  { value: 'top-24h', label: 'Top 24h' },
  { value: 'top-7d', label: 'Top 7d' },
  { value: 'controversial', label: 'Controversial' },
]

interface FeedFiltersProps {
  currentFilter: string
}

export function FeedFilters({ currentFilter }: FeedFiltersProps) {
  const router = useRouter()

  const handleFilterChange = (filter: string) => {
    router.push(`/feed?filter=${filter}`)
  }

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilterChange(filter.value)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            currentFilter === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
