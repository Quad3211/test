'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Notice {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  created_at: string
}

export function SystemNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchNotices = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get moderation logs for user's content
      const { data: logs } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      // Transform logs into notices
      const transformedNotices: Notice[] = (logs || []).map(log => ({
        id: log.id,
        type: log.action === 'remove' ? 'error' : log.action === 'flag' ? 'warning' : 'info',
        title: getNoticeTitle(log.action),
        message: getNoticeMessage(log.action, log.target_type, log.reason),
        created_at: log.created_at
      }))

      setNotices(transformedNotices)
      setLoading(false)
    }

    fetchNotices()
  }, [supabase])

  const getNoticeTitle = (action: string): string => {
    switch (action) {
      case 'remove': return 'Content Removed'
      case 'flag': return 'Content Under Review'
      case 'reinstate': return 'Content Reinstated'
      case 'warn': return 'Community Guidelines Reminder'
      default: return 'System Notice'
    }
  }

  const getNoticeMessage = (action: string, targetType: string, reason: string | null): string => {
    switch (action) {
      case 'remove':
        return `Your ${targetType} was removed for violating community guidelines${reason ? `: ${reason}` : ''}. If you believe this was a mistake, please contact support.`
      case 'flag':
        return `Your ${targetType} has been flagged for review${reason ? ` (${reason})` : ''}. Our moderation team will review it shortly.`
      case 'reinstate':
        return `Your ${targetType} has been reviewed and reinstated. Thank you for your patience.`
      case 'warn':
        return `Please review our community guidelines. ${reason || 'Let\'s keep OmniCampus a safe space for everyone.'}`
      default:
        return reason || 'You have a new system notification.'
    }
  }

  const getIcon = (type: Notice['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />
      case 'error': return <XCircle className="h-5 w-5 text-destructive" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />
      default: return <Info className="h-5 w-5 text-primary" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading notices...
        </CardContent>
      </Card>
    )
  }

  if (notices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No Notices</h3>
            <p className="text-sm text-muted-foreground">
              System notifications will appear here when relevant.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <Card key={notice.id} className={cn(
          'border-l-4',
          notice.type === 'error' && 'border-l-destructive',
          notice.type === 'warning' && 'border-l-warning',
          notice.type === 'success' && 'border-l-success',
          notice.type === 'info' && 'border-l-primary'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {getIcon(notice.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-medium text-sm">{notice.title}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{notice.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
