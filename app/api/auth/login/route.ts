import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = createClient()
  
  // Use NEXT_PUBLIC_SITE_URL for Vercel, fallback to request origin for local dev
  // Ensure we have a proper URL with protocol and no trailing slash
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin).replace(/\/$/, '')
  const redirectTo = `${siteUrl}/auth/callback`
  
  // Log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[OAuth] Site URL:', siteUrl)
    console.log('[OAuth] Redirect To:', redirectTo)
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    console.error('[OAuth] Error:', error)
    console.error('[OAuth] Data URL:', data?.url)
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
  }

  // Log the OAuth URL for debugging (first 100 chars to avoid logging full URL with tokens)
  if (process.env.NODE_ENV === 'development') {
    console.log('[OAuth] Generated URL (first 100 chars):', data.url.substring(0, 100))
  }

  return NextResponse.redirect(data.url)
}

