import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = createClient()
  
  // Use NEXT_PUBLIC_SITE_URL for Vercel, fallback to request origin for local dev
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
  const redirectTo = `${siteUrl}/auth/callback`
  
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
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
  }

  return NextResponse.redirect(data.url)
}

