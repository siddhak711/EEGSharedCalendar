'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      
      // Check for OAuth callback parameters in hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      // Check for code in query params (PKCE flow)
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      if (code) {
        // Exchange code for session (PKCE flow)
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Error exchanging code:', error)
          router.push('/login?error=auth_failed')
          return
        }
        // Redirect after successful exchange
        router.push('/dashboard')
        router.refresh()
        return
      }
      
      if (accessToken && refreshToken) {
        // Direct token flow (shouldn't happen with PKCE, but handle it)
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          console.error('Error setting session:', error)
          router.push('/login?error=auth_failed')
          return
        }
        router.push('/dashboard')
        router.refresh()
      } else {
        // Check if session already exists (might have been set by middleware)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
          router.refresh()
        } else {
          // Wait a bit for middleware to process, then check again
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                router.push('/dashboard')
                router.refresh()
              } else {
                router.push('/login?error=auth_failed')
              }
            })
          }, 1000)
        }
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}

