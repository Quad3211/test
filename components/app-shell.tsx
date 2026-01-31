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
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { OmniLogo } from '@/components/logo'
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
  requiresMod: true,
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
        if (profile) setUserRole(profile.role)
      }
    }
    fetchUserRole()
  }, [supabase])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const isMod = userRole === 'moderator' || userRole === 'admin'
  const allNavItems = isMod ? [...navItems, modNavItem] : navItems

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-border bg-card pb-4">
          {/* Logo row — padded so text aligns with nav labels */}
          <div className="flex h-16 shrink-0 items-center px-5">
            <Link href="/feed" className="flex items-center gap-2.5">
              <OmniLogo size={30} />
              <span className="font-display text-lg font-semibold tracking-tight">OmniCampus</span>
            </Link>
          </div>

          {/* Nav pills — px-2 inset keeps active pill off the walls */}
          <nav className="flex flex-1 flex-col px-2">
            <ul className="flex flex-1 flex-col gap-y-0.5">
              {allNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 bg-card border-b border-border px-4 py-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="-m-2 h-9 w-9"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-center">
          <Link href="/feed" className="flex items-center gap-2">
            <OmniLogo size={26} />
            <span className="font-display text-base font-semibold tracking-tight">OmniCampus</span>
          </Link>
        </div>
        <div className="w-9" />
      </div>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <Link href="/feed" className="flex items-center gap-2.5">
                <OmniLogo size={28} />
                <span className="font-display text-lg font-semibold tracking-tight">OmniCampus</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-9 w-9"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-y-0.5">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border lg:hidden">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors',
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.icon}
              <span className="text-xs leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* ─── Main Content ───
          Top padding raised: py-8 mobile → py-10 desktop
            → page headings ("Campus Feed", "Settings") now have real breathing room
          Side padding: px-4 → sm:px-6 → lg:px-8
            → content stays well clear of sidebar edge
          Bottom padding: pb-28 mobile (clears fixed bottom nav), pb-8 desktop
      */}
      <main className="lg:pl-64">
        <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10 pb-28 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}