import { Smile, Meh, Frown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SentimentBadgeProps {
  sentiment: string | null
  className?: string
}

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  if (!sentiment) return null
  
  const config = {
    positive: {
      icon: Smile,
      label: 'Positive',
      className: 'bg-success/10 text-success'
    },
    negative: {
      icon: Frown,
      label: 'Negative', 
      className: 'bg-destructive/10 text-destructive'
    },
    neutral: {
      icon: Meh,
      label: 'Neutral',
      className: 'bg-muted text-muted-foreground'
    }
  }
  
  const { icon: Icon, label, className: badgeClass } = config[sentiment as keyof typeof config] || config.neutral
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        badgeClass,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
