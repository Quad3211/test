'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  TrendingUp, 
  PlusCircle, 
  MessageSquare, 
  Settings,
  Shield,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  requiresMod?: boolean
}

const navItems: NavItem[] = [
  { href: '/feed', label: 'Feed', icon: <Home className="h-5 w-5" /> },
  { href: '/trends', label: 'Trends', icon: <TrendingUp className="h-5 w-5" /> },
  { href: '/post/new', label: 'New', icon: <PlusCircle className="h-5 w-5" /> },
  { href: '/inbox', label: 'Inbox', icon: <MessageSquare className="h-5 w-5" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
]

const modNavItem: NavItem = {
  href: '/moderation',
  label: 'Moderate',
  icon: <Shield className="h-5 w-5" />,
  requiresMod: true
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    fetchUserRole()
  }, [supabase])

  const isMod = userRole === 'moderator' || userRole === 'admin'
  const allNavItems = isMod ? [...navItems, modNavItem] : navItems

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/feed" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">O</span>
              </div>
              <span className="font-display text-xl font-semibold">OmniCampus</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-2">
              {allNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex gap-x-3 rounded-xl p-3 text-sm font-medium leading-6 transition-all duration-150',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 bg-card border-b border-border px-4 py-3 shadow-sm lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="-m-2.5"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex-1 flex items-center justify-center">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">O</span>
            </div>
            <span className="font-display text-lg font-semibold">OmniCampus</span>
          </Link>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <Link href="/feed" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">O</span>
                </div>
                <span className="font-display text-xl font-semibold">OmniCampus</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex flex-col gap-y-2">
              {allNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-x-3 rounded-xl p-3 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8 pb-20 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  )
}
