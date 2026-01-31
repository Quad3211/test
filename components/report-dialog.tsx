'use client'

import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { ReportReason } from '@/types/database'

interface ReportDialogProps {
  targetType: 'post' | 'comment'
  targetId: string
  trigger?: React.ReactNode
}

const reportReasons: { value: ReportReason; label: string; description: string }[] = [
  { value: 'harassment', label: 'Harassment', description: 'Bullying, intimidation, or targeting' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Content attacking protected groups' },
  { value: 'doxxing', label: 'Doxxing', description: 'Sharing private information' },
  { value: 'spam', label: 'Spam', description: 'Promotional or repetitive content' },
  { value: 'threats', label: 'Threats', description: 'Violence or physical threats' },
  { value: 'self_harm', label: 'Self-Harm', description: 'Content promoting self-harm' },
  { value: 'other', label: 'Other', description: 'Other violations not listed' },
]

export function ReportDialog({ targetType, targetId, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!reason) return
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('reports').insert({
        reported_by: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || null
      })

      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setReason(null)
        setDetails('')
      }, 1500)
    } catch (error) {
      console.error('Report error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="h-6 w-6 text-success" />
            </div>
            <DialogTitle className="mb-2">Report Submitted</DialogTitle>
            <DialogDescription>
              Thank you for helping keep OmniCampus safe. Our moderators will review this content.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report Content</DialogTitle>
              <DialogDescription>
                Help us understand what's wrong with this {targetType}. All reports are reviewed by our moderation team.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason for report</Label>
                <div className="grid gap-2">
                  {reportReasons.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setReason(item.value)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors ${
                        reason === item.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <span className="font-medium text-sm">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="details">Additional details (optional)</Label>
                <Textarea
                  id="details"
                  placeholder="Provide any additional context..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!reason || loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
