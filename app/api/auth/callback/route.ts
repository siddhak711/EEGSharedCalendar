import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to the dashboard after successful authentication
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}

