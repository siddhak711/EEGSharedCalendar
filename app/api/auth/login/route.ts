import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = createClient()
  
  // Use a callback page that will handle the OAuth response
  const redirectTo = `${requestUrl.origin}/auth/callback`
  
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

