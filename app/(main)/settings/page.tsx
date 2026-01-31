'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Shield, Ban, LogOut, Loader2, Trash2, Plus, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  name: string
  university_name: string
  role: string
  created_at: string
}

interface MutedKeyword {
  id: string
  keyword: string
}

interface BlockedUser {
  blocked_user_id: string
  profiles: { name: string }
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mutedKeywords, setMutedKeywords] = useState<MutedKeyword[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          name,
          role,
          created_at,
          universities(name)
        `)
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile({
          name: profileData.name,
          university_name: (profileData.universities as any)?.name || 'Unknown',
          role: profileData.role,
          created_at: profileData.created_at
        })
      }

      // Get muted keywords
      const { data: keywords } = await supabase
        .from('muted_keywords')
        .select('id, keyword')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setMutedKeywords(keywords || [])

      // Get blocked users
      const { data: blocked } = await supabase
        .from('blocks')
        .select(`
          blocked_user_id,
          profiles!blocks_blocked_user_id_fkey(name)
        `)
        .eq('blocker_user_id', user.id)

      setBlockedUsers(blocked || [])
    } catch (err) {
      console.error('Settings error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return

    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('muted_keywords')
        .insert({
          user_id: user.id,
          keyword: newKeyword.trim().toLowerCase()
        })
        .select()
        .single()

      if (error) throw error

      setMutedKeywords(prev => [data, ...prev])
      setNewKeyword('')
      setSuccess('Keyword added')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to add keyword')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveKeyword = async (id: string) => {
    try {
      const { error } = await supabase
        .from('muted_keywords')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMutedKeywords(prev => prev.filter(k => k.id !== id))
    } catch (err) {
      console.error('Remove keyword error:', err)
    }
  }

  const handleUnblock = async (blockedUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_user_id', user.id)
        .eq('blocked_user_id', blockedUserId)

      if (error) throw error

      setBlockedUsers(prev => prev.filter(b => b.blocked_user_id !== blockedUserId))
    } catch (err) {
      console.error('Unblock error:', err)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and privacy settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-success bg-success/10">
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <p className="font-medium">{profile?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">University</Label>
              <p className="font-medium">{profile?.university_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Role</Label>
              <p className="font-medium capitalize">{profile?.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Member Since</Label>
              <p className="font-medium">
                {profile?.created_at && new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Muted Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Shield className="h-5 w-5 text-primary" />
            Muted Keywords
          </CardTitle>
          <CardDescription>
            Posts and comments containing these keywords will be hidden from your feed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a keyword to mute..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              disabled={saving}
            />
            <Button onClick={handleAddKeyword} disabled={saving || !newKeyword.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {mutedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {mutedKeywords.map((keyword) => (
                <span
                  key={keyword.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm"
                >
                  {keyword.keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword.id)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove ${keyword.keyword}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No muted keywords yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Ban className="h-5 w-5 text-primary" />
            Blocked Users
          </CardTitle>
          <CardDescription>
            You won't see posts or comments from blocked users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length > 0 ? (
            <div className="space-y-2">
              {blockedUsers.map((blocked) => (
                <div
                  key={blocked.blocked_user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <span className="font-medium">{(blocked.profiles as any)?.name || 'Unknown User'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblock(blocked.blocked_user_id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No blocked users.</p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Anonymity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">When you post anonymously:</strong>
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your name and identity are hidden from other users</li>
              <li>Only authorized moderators can view author information when investigating reports</li>
              <li>Anonymous aliases are used within threads so you can be identified in conversations</li>
              <li>Your posts are still subject to community guidelines</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Separator />

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleSignOut} className="text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
