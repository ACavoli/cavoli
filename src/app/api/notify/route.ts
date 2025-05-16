import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabase } from '@/lib/supabase'

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  'mailto:ahcavoli@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { content, type, contentId } = await request.json()

    // Get all push subscriptions from the database
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')

    if (error) throw error

    // Send push notification to all subscriptions
    const notificationPayload = {
      title: 'Content Approval Required',
      body: content,
      data: {
        type,
        content,
        contentId,
        actions: [
          {
            action: 'approve',
            title: 'Approve'
          },
          {
            action: 'deny',
            title: 'Deny'
          }
        ]
      }
    }

    const pushPromises = subscriptions.map(({ subscription }) =>
      webpush.sendNotification(
        subscription,
        JSON.stringify(notificationPayload)
      ).catch(error => {
        if (error.statusCode === 410) {
          // Subscription has expired or is no longer valid
          return supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription', subscription)
        }
        throw error
      })
    )

    await Promise.all(pushPromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
} 