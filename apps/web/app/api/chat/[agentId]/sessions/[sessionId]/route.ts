import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string; sessionId: string }> }
) {
  try {
    const { agentId, sessionId } = await params

    const url = `${API_URL}/chat/${agentId}/sessions/${sessionId}`
    console.log('[API Route /api/chat/[agentId]/sessions/[sessionId]] Proxying to:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch session' }))
      console.error('[API Route /api/chat/[agentId]/sessions/[sessionId]] Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        body: error,
      })
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    console.log('[API Route /api/chat/[agentId]/sessions/[sessionId]] Backend response data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat session', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string; sessionId: string }> }
) {
  try {
    const { agentId, sessionId } = await params

    const url = `${API_URL}/chat/${agentId}/sessions/${sessionId}`
    console.log('[API Route /api/chat/[agentId]/sessions/[sessionId]] DELETE Proxying to:', url)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete session' }))
      console.error('[API Route /api/chat/[agentId]/sessions/[sessionId]] DELETE Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        body: error,
      })
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    console.log('[API Route /api/chat/[agentId]/sessions/[sessionId]] DELETE Backend response data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting chat session:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat session', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
