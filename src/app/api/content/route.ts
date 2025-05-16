import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { contentId, action } = await request.json()

    if (action === 'approve') {
      const { error } = await supabase
        .from('content')
        .update({ approved: true })
        .eq('id', contentId)

      if (error) throw error
    } else if (action === 'deny') {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId)

      if (error) throw error
    } else {
      throw new Error('Invalid action')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing content action:', error)
    return NextResponse.json(
      { error: 'Failed to process content action' },
      { status: 500 }
    )
  }
} 