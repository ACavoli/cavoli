'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

async function approveContent(contentId: number) {
  'use server'
  
  const { error } = await supabase
    .from('content')
    .update({ approved: true })
    .eq('id', contentId)

  if (error) {
    throw new Error('Failed to approve content')
  }
}

async function denyContent(contentId: number) {
  'use server'
  
  const { error } = await supabase
    .from('content')
    .delete()
    .eq('id', contentId)

  if (error) {
    throw new Error('Failed to deny content')
  }
}

export function ApproveButtons({ contentId }: { contentId: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleApprove = async () => {
    startTransition(async () => {
      try {
        await approveContent(contentId)
        router.push('/database')
      } catch (error) {
        console.error('Error approving content:', error)
        alert('Failed to approve content')
      }
    })
  }

  const handleDeny = async () => {
    startTransition(async () => {
      try {
        await denyContent(contentId)
        router.push('/database')
      } catch (error) {
        console.error('Error denying content:', error)
        alert('Failed to deny content')
      }
    })
  }

  return (
    <div className="flex gap-4">
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="flex-1 bg-green-600 hover:bg-green-700"
      >
        {isPending ? 'Processing...' : 'Approve'}
      </Button>
      <Button
        onClick={handleDeny}
        disabled={isPending}
        variant="destructive"
        className="flex-1"
      >
        {isPending ? 'Processing...' : 'Deny'}
      </Button>
    </div>
  )
} 