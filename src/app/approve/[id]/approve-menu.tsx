"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Content {
    id: number
    content: string
    approved: boolean
    createdon: string
  }

export function ApproveMenu({ id }: {id: string}) {
    const router = useRouter()
    const [content, setContent] = useState<Content | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
    fetchContent()
    }, [id])

    const fetchContent = async () => {
    try {
        const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('id', id)
        .single()

        if (error) throw error
        setContent(data)
    } catch (error) {
        setError('Failed to fetch content')
        console.error('Error:', error)
    } finally {
        setLoading(false)
    }
    }

    const handleAction = async (action: 'approve' | 'deny') => {
    try {
        setLoading(true)
        if (action === 'approve') {
        const { error } = await supabase
            .from('content')
            .update({ approved: true })
            .eq('id', id)
        if (error) throw error
        } else {
        const { error } = await supabase
            .from('content')
            .delete()
            .eq('id', id)
        if (error) throw error
        }
        router.push('/database')
    } catch (error) {
        setError('Failed to process action')
        console.error('Error:', error)
    } finally {
        setLoading(false)
    }
    }

    if (error || !content) {
    return (
        <div className="container mx-auto p-4 max-w-2xl">
        <p className="text-red-500">{error || 'Content not found'}</p>
        <Button onClick={() => router.push('/database')} className="mt-4">
            Return to Database
        </Button>
        </div>
    )
    }

    return (
    <div className="container mx-auto p-4 max-w-2xl">
        <Card>
        <CardHeader>
            <CardTitle>Content Approval</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800">{content.content}</p>
                <p className="text-sm text-gray-500 mt-2">
                Submitted on: {new Date(content.createdon).toLocaleString()}
                </p>
            </div>
            
            <div className="flex gap-4">
                <Button
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
                >
                Approve
                </Button>
                <Button
                onClick={() => handleAction('deny')}
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
    </div>
    )
}