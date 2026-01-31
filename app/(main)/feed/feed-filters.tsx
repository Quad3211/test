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
    <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilterChange(filter.value)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out',
            currentFilter === filter.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}