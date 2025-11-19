'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      
      // Get code from query params (PKCE flow)
      const code = searchParams.get('code')
      
      if (code) {
        try {
          // Exchange code for session (PKCE flow)
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Error exchanging code:', error)
            // Clean up URL and redirect to login with error
            window.history.replaceState({}, '', '/auth/callback')
            router.push('/login?error=auth_failed')
            return
          }
          
          // Clean up URL by removing query params
          window.history.replaceState({}, '', '/auth/callback')
          
          // Redirect to dashboard after successful exchange
          router.push('/dashboard')
          router.refresh()
        } catch (err) {
          console.error('Unexpected error during auth callback:', err)
          window.history.replaceState({}, '', '/auth/callback')
          router.push('/login?error=auth_failed')
        }
      } else {
        // No code parameter - check if session already exists
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          window.history.replaceState({}, '', '/auth/callback')
          router.push('/dashboard')
          router.refresh()
        } else {
          // No code and no session - redirect to login
          window.history.replaceState({}, '', '/auth/callback')
          router.push('/login?error=auth_failed')
        }
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}

