import { useState, useEffect } from 'react'
import { AuthService } from '@/service/auth'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  accessToken: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
  })

  // Check for existing token on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem('azure_access_token')
      const user = localStorage.getItem('azure_user')
      
      if (token && user) {
        try {
          // Validate the stored token
          const isValid = await AuthService.validateToken(token)
          
          if (isValid) {
            const userData = JSON.parse(user)
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: userData,
              accessToken: token,
            })
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('azure_access_token')
            localStorage.removeItem('azure_user')
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              accessToken: null,
            })
          }
        } catch (error) {
          console.error('Token validation error:', error)
          // Clear invalid data
          localStorage.removeItem('azure_access_token')
          localStorage.removeItem('azure_user')
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            accessToken: null,
          })
        }
      } else {
        // No stored token
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }

    checkExistingAuth()
  }, [])

  // Listen for OAuth messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'OAUTH_SUCCESS') {
        const { accessToken, user } = event.data.payload
        
        // Store token and user info
        localStorage.setItem('azure_access_token', accessToken)
        localStorage.setItem('azure_user', JSON.stringify(user))
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user,
          accessToken,
        })
      }
      if (event.data.type === 'OAUTH_ERROR') {
        console.error('OAuth error:', event.data.error)
        setAuthState(prev => ({ ...prev, isLoading: false }))
        
        // You could show a toast notification here
        // toast.error('Login failed: ' + event.data.error)
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    AuthService.startOAuthFlow()
  }

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('azure_access_token')
    localStorage.removeItem('azure_user')
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      accessToken: null,
    })
  }

  const refreshToken = async () => {
    const token = localStorage.getItem('azure_access_token')
    if (!token) return false

    try {
      const isValid = await AuthService.validateToken(token)
      if (!isValid) {
        logout()
        return false
      }
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  return {
    ...authState,
    login,
    logout,
    refreshToken,
  }
} 