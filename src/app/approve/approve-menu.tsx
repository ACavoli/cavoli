'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Content {
  id: number
  content: string
  approved: boolean
  createdon: string
}

const APPROVAL_PASSWORD = process.env.NEXT_PUBLIC_APPROVAL_PASSWORD

export function ApproveMenu() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const password = searchParams.get('password')
    if (password !== APPROVAL_PASSWORD) {
      router.push('/')
      return
    }
    fetchUnapprovedContent()
  }, [searchParams])

  const fetchUnapprovedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('approved', false)
        .order('createdon', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (error) {
      setError('Failed to fetch content')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (contentId: number, action: 'approve' | 'deny') => {
    try {
      setLoading(true)
      if (action === 'approve') {
        const { error } = await supabase
          .from('content')
          .update({ approved: true })
          .eq('id', contentId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('content')
          .delete()
          .eq('id', contentId)
        if (error) throw error
      }
      // Refresh the content list
      await fetchUnapprovedContent()
    } catch (error) {
      setError('Failed to process action')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.push('/database')} className="mt-4">
          Return to Database
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Content Approval</h1>
        <Button onClick={() => router.push('/database')} variant="outline">
          Return to Database
        </Button>
      </div>

      {contents.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No content pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contents.map((content) => (
            <Card key={content.id}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800">{content.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Submitted on: {new Date(content.createdon).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleAction(content.id, 'approve')}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(content.id, 'deny')}
                      disabled={loading}
                      variant="destructive"
                      className="flex-1"
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 