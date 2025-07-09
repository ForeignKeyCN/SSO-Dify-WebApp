// Azure AD OAuth configuration
const AZURE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
  scopes: ['User.Read', 'Mail.Read', 'Calendars.Read']
}

export class AuthService {
  // Start OAuth flow
  static startOAuthFlow(): void {
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
    authUrl.searchParams.append('client_id', AZURE_CONFIG.clientId)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('redirect_uri', AZURE_CONFIG.redirectUri)
    authUrl.searchParams.append('scope', AZURE_CONFIG.scopes.join(' '))
    authUrl.searchParams.append('response_mode', 'query')
    authUrl.searchParams.append('state', this.generateState())
    authUrl.searchParams.append('prompt', 'select_account')

    // Open popup window
    const popup = window.open(
      authUrl.toString(),
      'azure-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    // Listen for popup close
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        // Handle popup closed without completion
        window.dispatchEvent(new CustomEvent('oauth-cancelled'))
      }
    }, 1000)
  }

  // Handle OAuth callback
  static async handleCallback(code: string, state: string): Promise<{ accessToken: string, user: any }> {
    try {
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      })

      if (!response.ok) {
        throw new Error('OAuth callback failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('OAuth callback error:', error)
      throw error
    }
  }

  // Validate token
  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15)
  }
} 