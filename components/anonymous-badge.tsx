import { EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnonymousBadgeProps {
  alias?: string
  className?: string
  size?: 'sm' | 'default'
}

export function AnonymousBadge({ alias, className, size = 'default' }: AnonymousBadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <EyeOff className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {alias || 'Anonymous'}
    </span>
  )
}
