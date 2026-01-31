'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Search, GraduationCap, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface University {
  id: string
  name: string
  abbrev: string | null
  domain: string | null
  location: string | null
}

export default function UniversityOnboardingPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [search, setSearch] = useState('')
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: { user } }, { data, error: uniError }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('universities').select('*').order('name'),
        ])

        if (user?.email) setUserEmail(user.email)
        if (uniError) throw uniError
        setUniversities(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load universities')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  // Memoized filtering avoids re-computation on every render
  const filteredUniversities = useMemo(() => {
    if (!search.trim()) return universities
    const query = search.toLowerCase()
    return universities.filter(
      (uni) =>
        uni.name.toLowerCase().includes(query) ||
        (uni.abbrev?.toLowerCase().includes(query)) ||
        (uni.location?.toLowerCase().includes(query))
    )
  }, [search, universities])

  const validateEmailDomain = (university: University): boolean => {
    if (!university.domain || !userEmail) return true
    const emailDomain = userEmail.split('@')[1]
    return emailDomain?.toLowerCase() === university.domain.toLowerCase()
  }

  const handleSelectUniversity = async () => {
    if (!selectedUniversity) return

    if (!validateEmailDomain(selectedUniversity)) {
      setError(`Your email must be from ${selectedUniversity.domain} to join ${selectedUniversity.name}`)
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          university_id: selectedUniversity.id,
          is_verified: true,
        })
        .eq('user_id', user.id)

      if (error) throw error

      router.push('/feed')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save university')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading universities…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-0 pt-8 pb-4 px-8 text-center">
          <div className="flex items-center justify-center mb-5">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl font-display tracking-tight">Select Your University</CardTitle>
          <CardDescription className="text-sm mt-1">
            Choose your university to join campus discussions. You can only see posts from your own campus.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search universities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* University List */}
          <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border bg-muted/30 p-1.5">
            {filteredUniversities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No universities found
              </p>
            ) : (
              filteredUniversities.map((university) => {
                const isSelected = selectedUniversity?.id === university.id
                const domainMismatch = !validateEmailDomain(university)

                return (
                  <button
                    key={university.id}
                    type="button"
                    onClick={() => {
                      setSelectedUniversity(university)
                      setError('')
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-150',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted',
                      domainMismatch && !isSelected && 'opacity-45'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{university.name}</span>
                        {university.abbrev && (
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-md font-medium',
                            isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {university.abbrev}
                          </span>
                        )}
                      </div>
                      {university.location && (
                        <p className={cn(
                          'text-xs truncate mt-0.5',
                          isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {university.location}
                        </p>
                      )}
                      {domainMismatch && !isSelected && (
                        <p className="text-xs text-destructive mt-0.5">
                          Requires @{university.domain}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </CardContent>

        <CardFooter className="px-8 pb-8">
          <Button
            onClick={handleSelectUniversity}
            className="w-full h-10"
            disabled={!selectedUniversity || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining…
              </>
            ) : (
              'Join University'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}