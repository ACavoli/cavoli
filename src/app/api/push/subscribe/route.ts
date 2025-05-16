import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabase } from '@/lib/supabase'

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const subscription = await request.json()

    // Store the subscription in your database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert([
        {
          subscription: subscription,
          user_id: 'admin' // Replace with actual user ID if you have authentication
        }
      ])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to store push subscription' },
      { status: 500 }
    )
  }
} 