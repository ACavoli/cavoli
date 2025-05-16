'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { subscribeToPushNotifications } from '@/lib/push'
import { toast } from 'sonner'

interface Content {
  id: number
  content: string
  approved: boolean
  createdon: string
}

const subscribable = false

export default function Database() {
  const [content, setContent] = useState('')
  const [approvedContent, setApprovedContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    fetchApprovedContent()
    if (subscribable) {
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    }
  }

  const handleSubscribe = async () => {
    try {
      await subscribeToPushNotifications()
      setIsSubscribed(true)
      toast.success('Successfully subscribed to push notifications!')
      toast('Successfully subscribed to push notifications!')
    } catch (error) {
      console.error('Failed to subscribe:', error)
      toast.error('Failed to subscribe to push notifications')
      toast('Failed to subscribe to push notifications')
    }
  }

  const fetchApprovedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('approved', true)
        .order('createdon', { ascending: false })

      if (error) throw error
      setApprovedContent(data || [])
    } catch (error) {
      console.error('Error fetching content:', error)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('content')
        .insert([
          {
            content: content.trim(),
            approved: false,
            createdon: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error

      // Send push notification
      await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          type: 'content_approval',
          contentId: data[0].id
        }),
      })

      setContent('')
      toast.success('Content submitted for approval')
      toast('Content submitted for approval')
    } catch (error) {
      console.error('Error submitting content:', error)
      toast.error('Error submitting content')
      toast('Error submitting content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Content Management</h1>
      
      {(!isSubscribed && subscribable) && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800 mb-2">
            Enable push notifications to receive approval requests
          </p>
          <Button onClick={handleSubscribe} variant="outline">
            Enable Notifications
          </Button>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter content..."
            className="flex-1"
          />
          <Button 
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Approved Content</h2>
        {approvedContent.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <p className="text-gray-800">{item.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(item.createdon).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
        {approvedContent.length === 0 && (
          <p className="text-gray-500">No approved content yet</p>
        )}
      </div>
    </div>
  )
}
  