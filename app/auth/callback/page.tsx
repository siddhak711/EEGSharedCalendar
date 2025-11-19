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
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Error exchanging code:', error)
            // Check if it's a code already used error (common on first login retry)
            if (error.message?.includes('already been used') || error.message?.includes('invalid')) {
              // Code was already used - check if session exists
              const { data: { session: existingSession } } = await supabase.auth.getSession()
              if (existingSession) {
                // Session exists, just redirect
                window.history.replaceState({}, '', '/auth/callback')
                router.push('/dashboard')
                router.refresh()
                return
              }
            }
            // Clean up URL and redirect to login with error
            window.history.replaceState({}, '', '/auth/callback')
            router.push('/login?error=auth_failed')
            return
          }
          
          // Verify session was created successfully
          if (!data.session) {
            console.error('No session returned after code exchange')
            // Retry getting session after a brief delay
            await new Promise(resolve => setTimeout(resolve, 200))
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (!retrySession) {
              window.history.replaceState({}, '', '/auth/callback')
              router.push('/login?error=auth_failed')
              return
            }
          }
          
          // Wait a brief moment to ensure cookies are set and propagated
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Double-check session is available (with retry logic)
          let verifiedSession = null
          for (let i = 0; i < 3; i++) {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              verifiedSession = session
              break
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          if (!verifiedSession) {
            console.error('Session not found after exchange and retries')
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
          // On error, check if session might still exist
          const { data: { session: errorSession } } = await supabase.auth.getSession()
          if (errorSession) {
            window.history.replaceState({}, '', '/auth/callback')
            router.push('/dashboard')
            router.refresh()
          } else {
            window.history.replaceState({}, '', '/auth/callback')
            router.push('/login?error=auth_failed')
          }
        }
      } else {
        // No code parameter - check if session already exists
        // This might happen if user refreshes the page or returns without code
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

