'use client'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthService } from '@/service/auth'

export default function OAuthCallback() {
  const searchParams = useSearchParams()
  const hasProcessed = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple processing
      if (hasProcessed.current) {
        return
      }
      hasProcessed.current = true

      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        // Send error to parent window
        window.opener?.postMessage({
          type: 'OAUTH_ERROR',
          error: error,
        }, window.location.origin)
        window.close()
        return
      }

      if (code && state) {
        try {
          const result = await AuthService.handleCallback(code, state)
          
          // Send success to parent window
          window.opener?.postMessage({
            type: 'OAUTH_SUCCESS',
            payload: result,
          }, window.location.origin)
          
          window.close()
        } catch (error) {
          // Send error to parent window
          window.opener?.postMessage({
            type: 'OAUTH_ERROR',
            error: error,
          }, window.location.origin)
          window.close()
        }
      } else {
        // Missing required parameters
        window.opener?.postMessage({
          type: 'OAUTH_ERROR',
          error: 'Missing code or state parameters',
        }, window.location.origin)
        window.close()
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
} 