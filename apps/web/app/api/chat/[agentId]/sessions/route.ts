import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const queryParams = new URLSearchParams()
    if (userId) queryParams.set('userId', userId)

    const url = `${API_URL}/chat/${agentId}/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    console.log('[API Route /api/chat/[agentId]/sessions] Proxying to:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch sessions' }))
      console.error('[API Route /api/chat/[agentId]/sessions] Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        body: error,
      })
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    console.log('[API Route /api/chat/[agentId]/sessions] Backend response data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

