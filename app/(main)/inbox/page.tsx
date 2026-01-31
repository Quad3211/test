'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Bell, Heart } from 'lucide-react'
import { SupportChat } from './support-chat'
import { SystemNotices } from './system-notices'

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState('support')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Inbox</h1>
        <p className="text-muted-foreground">
          Chat with support or view system notifications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Support
          </TabsTrigger>
          <TabsTrigger value="notices" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Heart className="h-5 w-5 text-primary" />
                Support Chat
              </CardTitle>
              <CardDescription>
                Talk to our support bot for help, resources, or just to vent. Your conversations are private.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <SupportChat />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notices">
          <SystemNotices />
        </TabsContent>
      </Tabs>
    </div>
  )
}
