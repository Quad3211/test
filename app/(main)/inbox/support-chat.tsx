'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, AlertTriangle, Phone, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const CRISIS_RESOURCES = [
  { name: 'Jamaica Crisis Line', phone: '888-429-5255' },
  { name: 'Hope for Children', phone: '876-906-8660' },
]

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content: `Hello! I'm here to listen and help connect you with resources. This is a safe space - our conversation is private.

How are you feeling today? Feel free to share what's on your mind, or ask me about:
- Campus support resources
- Mental health information  
- Study tips and stress management
- General questions about OmniCampus

Remember, while I can provide information and support, I'm not a replacement for professional help. If you're in crisis, please reach out to a crisis helpline.`,
  timestamp: new Date(),
}

export function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCrisisAlert, setShowCrisisAlert] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check for distress keywords
  const checkForDistress = (text: string): boolean => {
    const distressKeywords = [
      'suicide', 'kill myself', 'end it all', 'no reason to live',
      'better off dead', 'self harm', 'cut myself', 'overdose',
      'want to die', 'hopeless', 'ending my life'
    ]
    return distressKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    )
  }

  const generateResponse = async (userMessage: string): Promise<string> => {
    // Check for crisis indicators
    if (checkForDistress(userMessage)) {
      setShowCrisisAlert(true)
      return `I hear you, and I want you to know that you're not alone. What you're feeling matters, and there are people who want to help.

If you're having thoughts of self-harm or suicide, please reach out to a crisis helpline right away. In Jamaica, you can call:
- Jamaica Crisis Line: 888-429-5255
- Hope for Children: 876-906-8660

Would you like to talk more about what's going on? I'm here to listen. And please remember, reaching out for help is a sign of strength, not weakness.`
    }

    // Simple response generation based on keywords
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('anxious')) {
      return `It sounds like you're dealing with a lot right now. That's completely understandable - university life can be really challenging.

Here are some things that might help:
1. Take short breaks between study sessions
2. Practice deep breathing exercises
3. Talk to someone you trust
4. Make sure you're getting enough sleep
5. Reach out to your university's counseling services

Would you like to talk more about what's causing you stress?`
    }

    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
      return `Feeling lonely can be really tough, especially in a new environment. You're not alone in feeling this way - many students experience this.

Some suggestions:
1. Join a campus club or organization
2. Attend campus events
3. Use OmniCampus to connect with peers (anonymously if you prefer)
4. Consider reaching out to counseling services

Would you like to share more about what you're experiencing?`
    }

    if (lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('study')) {
      return `Exam stress is something many students deal with. Here are some tips that might help:

1. Create a study schedule and stick to it
2. Take regular breaks (try the Pomodoro technique)
3. Get enough sleep - it's crucial for memory
4. Form study groups with classmates
5. Don't hesitate to ask professors for help

Remember, your worth isn't defined by grades. Is there a specific aspect of studying you'd like to discuss?`
    }

    if (lowerMessage.includes('thank')) {
      return `You're welcome! Remember, it's okay to ask for help whenever you need it. I'm always here to listen and provide resources.

Is there anything else I can help you with?`
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('resource')) {
      return `Here are some resources that might be helpful:

**On-Campus Support:**
- University Counseling Center
- Student Health Services
- Academic Advising
- Peer Support Programs

**External Resources:**
- Jamaica Crisis Line: 888-429-5255
- Hope for Children: 876-906-8660

**Self-Help Tools:**
- Meditation apps (Headspace, Calm)
- Exercise and physical activity
- Journaling

What specific kind of support are you looking for?`
    }

    // Default response
    return `Thank you for sharing that with me. I'm here to listen and help however I can.

Is there something specific you'd like to talk about or any resources I can help you find? Remember, you can also use OmniCampus to share your thoughts with the campus community anonymously.`
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await generateResponse(userMessage.content)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Crisis Alert */}
      {showCrisisAlert && (
        <Alert className="m-4 border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Crisis Resources</AlertTitle>
          <AlertDescription>
            <p className="mb-2">If you're in crisis, please reach out for help:</p>
            <div className="space-y-1">
              {CRISIS_RESOURCES.map(resource => (
                <a
                  key={resource.phone}
                  href={`tel:${resource.phone}`}
                  className="flex items-center gap-2 text-sm text-destructive hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {resource.name}: {resource.phone}
                </a>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={() => setShowCrisisAlert(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={cn(
                'text-xs mt-1',
                message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          This chat is private. For emergencies, call a crisis line.
        </p>
      </div>
    </div>
  )
}
