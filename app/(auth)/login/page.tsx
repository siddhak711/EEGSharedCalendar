import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-display font-bold text-white mb-4">
            SoundCheck
          </h1>
          <p className="text-lg text-wavelength-text-muted font-normal">
            The coolest way for NYC bands to find bands for their bills
          </p>
        </div>
        <LoginForm error={searchParams.error} />
      </div>
    </div>
  )
}

