import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' }, 
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Validate token with Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.ok) {
      // Token is valid, get user info
      const userData = await response.json()
      
      return NextResponse.json({ 
        valid: true,
        user: userData
      })
    } else {
      // Token is invalid or expired
      console.error('Token validation failed:', response.status, response.statusText)
      
      return NextResponse.json(
        { 
          valid: false,
          error: 'Token is invalid or expired'
        }, 
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Token validation error:', error)
    
    return NextResponse.json(
      { 
        valid: false,
        error: 'Validation failed' 
      }, 
      { status: 500 }
    )
  }
} 