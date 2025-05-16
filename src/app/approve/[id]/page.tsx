import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApproveButtons } from './approve-buttons'

interface Content {
  id: number
  content: string
  approved: boolean
  createdon: string
}

async function getContent(id: string): Promise<Content> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error('Failed to fetch content')
  }

  return data
}

export default async function ApproveContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let content: Content
  try {
    const { id } = await params
    content = await getContent(id)
  } catch (error) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <p className="text-red-500">Content not found</p>
        <form action={async () => redirect('/database')}>
          <Button type="submit" className="mt-4">
            Return to Database
          </Button>
        </form>
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
            
            <ApproveButtons contentId={content.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 