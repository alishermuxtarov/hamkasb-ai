import { NextRequest, NextResponse } from 'next/server'

// In Next.js API routes, we can use both NEXT_PUBLIC_ and regular env vars
// But for server-side, regular env vars are preferred
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'

// Log for debugging (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('[API Route] Using API_URL:', API_URL)
}

export async function GET(request: NextRequest) {
  console.log('[API Route /api/documents] GET request received')
  
  try {
    const { searchParams } = new URL(request.url)
    const catalogId = searchParams.get('catalogId')
    const clientId = searchParams.get('clientId')
    const limit = searchParams.get('limit')

    const queryParams = new URLSearchParams()
    if (catalogId) queryParams.set('catalogId', catalogId)
    if (clientId) queryParams.set('clientId', clientId)
    if (limit) queryParams.set('limit', limit)

    const url = `${API_URL}/agents/librarian/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    console.log('[API Route /api/documents] Proxying to:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch documents' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

