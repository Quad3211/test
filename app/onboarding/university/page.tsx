'use client'

import { useState, useEffect } from 'react'
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
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([])
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
        // Get user email for domain validation
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setUserEmail(user.email)
        }

        // Fetch universities
        const { data, error } = await supabase
          .from('universities')
          .select('*')
          .order('name')

        if (error) throw error
        setUniversities(data || [])
        setFilteredUniversities(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load universities')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    if (search.trim()) {
      const query = search.toLowerCase()
      const filtered = universities.filter(
        (uni) =>
          uni.name.toLowerCase().includes(query) ||
          (uni.abbrev && uni.abbrev.toLowerCase().includes(query)) ||
          (uni.location && uni.location.toLowerCase().includes(query))
      )
      setFilteredUniversities(filtered)
    } else {
      setFilteredUniversities(universities)
    }
  }, [search, universities])

  const validateEmailDomain = (university: University): boolean => {
    if (!university.domain || !userEmail) return true
    const emailDomain = userEmail.split('@')[1]
    return emailDomain?.toLowerCase() === university.domain.toLowerCase()
  }

  const handleSelectUniversity = async () => {
    if (!selectedUniversity) return

    // Validate email domain if configured
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
          is_verified: true // Mark as verified after selecting university
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading universities...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">Select Your University</CardTitle>
          <CardDescription>
            Choose your university to join campus discussions. You can only see posts from your own campus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search universities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* University List */}
          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-xl p-2">
            {filteredUniversities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
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
                    onClick={() => setSelectedUniversity(university)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg text-left transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                      domainMismatch && !isSelected && 'opacity-50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{university.name}</span>
                        {university.abbrev && (
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
                          )}>
                            {university.abbrev}
                          </span>
                        )}
                      </div>
                      {university.location && (
                        <p className={cn(
                          'text-sm truncate',
                          isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {university.location}
                        </p>
                      )}
                      {domainMismatch && !isSelected && (
                        <p className="text-xs text-destructive mt-1">
                          Requires @{university.domain} email
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSelectUniversity} 
            className="w-full" 
            disabled={!selectedUniversity || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
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
