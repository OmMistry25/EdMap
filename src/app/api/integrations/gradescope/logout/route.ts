import { NextRequest, NextResponse } from 'next/server'

const GRADESCOPE_API_URL = process.env.GRADESCOPE_API_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  try {
    // Forward the request to our Gradescope API server
    const response = await fetch(`${GRADESCOPE_API_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Logout failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Gradescope logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
