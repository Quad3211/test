'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Shield, 
  AlertTriangle, 
  Flag, 
  History, 
  Check, 
  X, 
  Eye,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FlaggedPost {
  id: string
  title: string | null
  content: string
  status: string
  created_at: string
  toxicity_score: number | null
  distress_score: number | null
  author_user_id: string
  profiles: { name: string; user_id: string }
}

interface Report {
  id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  target_type: 'post' | 'comment'
  target_id: string
}

interface Log {
  id: string
  action: string
  target_type: string
  target_id: string
  performed_by: string
  reason: string | null
  created_at: string
}

interface ModerationDashboardProps {
  flaggedPosts: FlaggedPost[]
  reports: Report[]
  logs: Log[]
  universityId: string
}

export function ModerationDashboard({ 
  flaggedPosts: initialFlaggedPosts, 
  reports: initialReports, 
  logs,
  universityId 
}: ModerationDashboardProps) {
  const [flaggedPosts, setFlaggedPosts] = useState(initialFlaggedPosts)
  const [reports, setReports] = useState(initialReports)
  const [activeTab, setActiveTab] = useState('flagged')
  const [selectedItem, setSelectedItem] = useState<FlaggedPost | Report | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dialogAction, setDialogAction] = useState<'remove' | 'reinstate' | 'dismiss' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAction = async (action: 'remove' | 'reinstate' | 'dismiss') => {
    if (!selectedItem) return
    
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if ('content' in selectedItem) {
        // It's a flagged post
        const newStatus = action === 'remove' ? 'removed' : 'active'
        
        await supabase
          .from('posts')
          .update({ status: newStatus })
          .eq('id', selectedItem.id)

        // Log the action
        await supabase.from('moderation_logs').insert({
          action,
          target_type: 'post',
          target_id: selectedItem.id,
          performed_by: user.id,
          reason: actionReason || null
        })

        setFlaggedPosts(prev => prev.filter(p => p.id !== selectedItem.id))
      } else {
        // It's a report
        const newStatus = action === 'dismiss' ? 'dismissed' : 'action_taken'
        
        await supabase
          .from('reports')
          .update({ 
            status: newStatus,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', selectedItem.id)

        // If action taken, also update the target content
        if (action === 'remove') {
          const table = selectedItem.target_type === 'post' ? 'posts' : 'comments'
          await supabase
            .from(table)
            .update({ status: 'removed' })
            .eq('id', selectedItem.target_id)

          await supabase.from('moderation_logs').insert({
            action: 'remove',
            target_type: selectedItem.target_type,
            target_id: selectedItem.target_id,
            performed_by: user.id,
            reason: `Report: ${selectedItem.reason}. ${actionReason || ''}`
          })
        }

        setReports(prev => prev.filter(r => r.id !== selectedItem.id))
      }

      setSelectedItem(null)
      setDialogAction(null)
      setActionReason('')
      router.refresh()
    } catch (error) {
      console.error('Moderation action error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (item: FlaggedPost | Report, action: 'remove' | 'reinstate' | 'dismiss') => {
    setSelectedItem(item)
    setDialogAction(action)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Moderation Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review flagged content and user reports
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{flaggedPosts.length}</p>
                <p className="text-xs text-muted-foreground">Flagged Content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Flag className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-xs text-muted-foreground">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Recent Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="flagged" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            AI Flagged ({flaggedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Flagged Content Tab */}
        <TabsContent value="flagged">
          {flaggedPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="h-12 w-12 mx-auto text-success mb-4" />
                <h3 className="font-medium mb-1">All Clear</h3>
                <p className="text-sm text-muted-foreground">No flagged content to review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {flaggedPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-warning border-warning">
                            Flagged
                          </Badge>
                          {post.toxicity_score && post.toxicity_score > 0.5 && (
                            <Badge variant="destructive">
                              Toxicity: {(post.toxicity_score * 100).toFixed(0)}%
                            </Badge>
                          )}
                          {post.distress_score && post.distress_score > 0.5 && (
                            <Badge className="bg-warning text-warning-foreground">
                              Distress: {(post.distress_score * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        {post.title && (
                          <h3 className="font-medium mb-1">{post.title}</h3>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By: {(post.profiles as any)?.name}</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(post, 'reinstate')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDialog(post, 'remove')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="h-12 w-12 mx-auto text-success mb-4" />
                <h3 className="font-medium mb-1">No Pending Reports</h3>
                <p className="text-sm text-muted-foreground">All reports have been reviewed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{report.reason.replace('_', ' ')}</Badge>
                          <Badge variant="outline">{report.target_type}</Badge>
                        </div>
                        {report.details && (
                          <p className="text-sm text-muted-foreground mb-2">
                            "{report.details}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(report, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDialog(report, 'remove')}
                        >
                          Remove Content
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No moderation actions recorded yet
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-4 flex items-center gap-4">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        log.action === 'remove' && 'bg-destructive/10',
                        log.action === 'flag' && 'bg-warning/10',
                        log.action === 'reinstate' && 'bg-success/10'
                      )}>
                        {log.action === 'remove' && <X className="h-4 w-4 text-destructive" />}
                        {log.action === 'flag' && <AlertTriangle className="h-4 w-4 text-warning" />}
                        {log.action === 'reinstate' && <Check className="h-4 w-4 text-success" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium capitalize">{log.action}</span>{' '}
                          <span className="text-muted-foreground">{log.target_type}</span>
                        </p>
                        {log.reason && (
                          <p className="text-xs text-muted-foreground truncate">
                            Reason: {log.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {log.performed_by === 'AI' ? 'AI' : 'Moderator'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!dialogAction} onOpenChange={() => setDialogAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'remove' && 'Remove Content'}
              {dialogAction === 'reinstate' && 'Approve Content'}
              {dialogAction === 'dismiss' && 'Dismiss Report'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'remove' && 'This will remove the content and notify the author.'}
              {dialogAction === 'reinstate' && 'This will make the content visible again.'}
              {dialogAction === 'dismiss' && 'This will close the report without action.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add a reason (optional)..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAction(null)}>
              Cancel
            </Button>
            <Button
              variant={dialogAction === 'remove' ? 'destructive' : 'default'}
              onClick={() => dialogAction && handleAction(dialogAction)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
