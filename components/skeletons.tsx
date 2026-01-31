'use client'

import { cn } from '@/lib/utils'

function Pulse({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-muted', className)}
      {...props}
    />
  )
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border bg-card shadow-sm p-4" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex gap-3">
            {/* Vote column */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <Pulse className="w-6 h-6" />
              <Pulse className="w-5 h-4" />
              <Pulse className="w-6 h-6" />
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <Pulse className="w-20 h-5" />
                <Pulse className="w-16 h-4" />
                <Pulse className="w-14 h-5" />
              </div>
              <Pulse className="w-3/4 h-5" />
              <div className="space-y-2">
                <Pulse className="w-full h-4" />
                <Pulse className="w-full h-4" />
                <Pulse className="w-2/3 h-4" />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                <Pulse className="w-24 h-4" />
                <Pulse className="w-16 h-4" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Pulse className="w-28 h-5" />

      {/* Post card */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <Pulse className="w-6 h-6" />
            <Pulse className="w-5 h-5" />
            <Pulse className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Pulse className="w-24 h-5" />
              <Pulse className="w-20 h-4" />
              <Pulse className="w-16 h-5" />
            </div>
            <Pulse className="w-4/5 h-7" />
            <div className="space-y-2">
              <Pulse className="w-full h-4" />
              <Pulse className="w-full h-4" />
              <Pulse className="w-full h-4" />
              <Pulse className="w-3/4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Comment form placeholder */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <Pulse className="w-full h-10" />
        <Pulse className="w-full h-24" />
        <div className="flex justify-end">
          <Pulse className="w-28 h-10" />
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <Pulse className="w-32 h-6" />
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <Pulse className="w-5 h-5" />
                <Pulse className="w-4 h-3" />
                <Pulse className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Pulse className="w-20 h-4" />
                  <Pulse className="w-14 h-3" />
                </div>
                <Pulse className="w-full h-4" />
                <Pulse className={cn('h-4', i === 0 ? 'w-4/5' : 'w-3/5')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TrendsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Mood meter - full width */}
      <div className="md:col-span-2 rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <Pulse className="w-40 h-6" />
        <div className="flex items-center gap-6">
          <Pulse className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Pulse className="w-20 h-3" />
              <Pulse className="flex-1 h-3" />
              <Pulse className="w-8 h-3" />
            </div>
            <div className="flex items-center gap-2">
              <Pulse className="w-20 h-3" />
              <Pulse className="flex-1 h-3" />
              <Pulse className="w-8 h-3" />
            </div>
            <div className="flex items-center gap-2">
              <Pulse className="w-20 h-3" />
              <Pulse className="flex-1 h-3" />
              <Pulse className="w-8 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Campus keywords */}
      <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <Pulse className="w-44 h-6" />
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <Pulse key={i} className="h-8" style={{ width: `${60 + (i * 20) % 80}px` }} />
          ))}
        </div>
      </div>

      {/* National trends */}
      <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <Pulse className="w-36 h-6" />
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <Pulse key={i} className="h-8" style={{ width: `${70 + (i * 25) % 70}px` }} />
          ))}
        </div>
      </div>

      {/* Top posts - full width */}
      <div className="md:col-span-2 rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <Pulse className="w-40 h-6" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Pulse className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Pulse className="h-5" style={{ width: `${50 + (i * 15) % 40}%` }} />
                <div className="flex gap-3">
                  <Pulse className="w-24 h-3" />
                  <Pulse className="w-20 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ComposerSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-6 border-b border-border">
        <Pulse className="w-36 h-6" />
      </div>
      <div className="p-6 space-y-4">
        <Pulse className="w-full h-14 rounded-xl" />
        <div className="space-y-2">
          <Pulse className="w-24 h-4" />
          <Pulse className="w-full h-10" />
        </div>
        <div className="space-y-2">
          <Pulse className="w-20 h-4" />
          <Pulse className="w-full h-40" />
        </div>
      </div>
      <div className="p-6 border-t border-border flex justify-end gap-3">
        <Pulse className="w-24 h-10" />
        <Pulse className="w-24 h-10" />
      </div>
    </div>
  )
}