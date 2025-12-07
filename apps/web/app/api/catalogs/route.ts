import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'

export async function GET() {
  console.log('[API Route /api/catalogs] GET request received')
  
  try {
    const url = `${API_URL}/agents/librarian/catalogs`
    console.log('[API Route /api/catalogs] Proxying to:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch catalogs' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching catalogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalogs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, parentId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const response = await fetch(`${API_URL}/agents/librarian/catalogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, parentId }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create catalog' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating catalog:', error)
    return NextResponse.json(
      { error: 'Failed to create catalog', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

