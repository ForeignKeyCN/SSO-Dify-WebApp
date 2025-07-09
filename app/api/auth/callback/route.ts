import { NextRequest, NextResponse } from 'next/server'
import { getInfo } from '@/app/api/utils/common'

console.log('AZURE_CLIENT_ID:', process.env.AZURE_CLIENT_ID)
console.log('AZURE_CLIENT_SECRET:', process.env.AZURE_CLIENT_SECRET ? 'SET' : 'NOT SET')
console.log('AZURE_REDIRECT_URI:', process.env.AZURE_REDIRECT_URI)

// Simple cache to prevent duplicate code processing
const processedCodes = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.AZURE_CLIENT_ID) {
      console.error('AZURE_CLIENT_ID is not set')
      return NextResponse.json(
        { error: 'Azure client ID not configured' },
        { status: 500 }
      )
    }

    if (!process.env.AZURE_CLIENT_SECRET) {
      console.error('AZURE_CLIENT_SECRET is not set')
      return NextResponse.json(
        { error: 'Azure client secret not configured' },
        { status: 500 }
      )
    }

    if (!process.env.AZURE_REDIRECT_URI) {
      console.error('AZURE_REDIRECT_URI is not set')
      return NextResponse.json(
        { error: 'Azure redirect URI not configured' },
        { status: 500 }
      )
    }

    // Validate redirect URI format
    try {
      new URL(process.env.AZURE_REDIRECT_URI)
    } catch (error) {
      console.error('Invalid AZURE_REDIRECT_URI format:', process.env.AZURE_REDIRECT_URI)
      return NextResponse.json(
        { error: 'Invalid redirect URI format' },
        { status: 500 }
      )
    }

    // Check if code was already processed
    if (processedCodes.has(code)) {
      return NextResponse.json(
        { error: 'Authorization code already processed' },
        { status: 400 }
      )
    }

    // Mark code as processed
    processedCodes.add(code)

    console.log('Exchanging code for token with redirect_uri:', process.env.AZURE_REDIRECT_URI)

    // Exchange code for access token with Azure AD
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        code: code,
        redirect_uri: process.env.AZURE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Azure token exchange failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to exchange code for token' },
        { status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()

    // Get user information from Microsoft Graph API
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to get user info from Microsoft Graph')
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 400 }
      )
    }

    const userData = await userResponse.json()

    // Get your Dify-side user ID
    const { user: difyUserId } = getInfo(request)

    // Store token using your Dify user ID
    await storeTokenForBackend(difyUserId, tokenData.access_token)

    return NextResponse.json({
      accessToken: tokenData.access_token,
      user: userData,
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

async function storeTokenForBackend(userId: string, accessToken: string) {
  try {
    // Get the endpoint URL from environment variable
    const endpointUrl = process.env.ACCESS_TOKEN_ENDPOINT_URL || 'http://localhost:5000'
    const apiKey = process.env.ACCESS_TOKEN_API_KEY || 'your_api_key_here'
    
    const response = await fetch(`${endpointUrl}/post_access_token_endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': apiKey
      },
      body: JSON.stringify({
        user_id: userId,
        access_token: accessToken
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to store token: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log(`Token stored successfully for user ${userId}:`, result.message)
    
    return result
  } catch (error) {
    console.error('Error storing token:', error)
    throw error
  }
} 