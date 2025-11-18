'use client'

import { useState, useEffect } from 'react'

interface LoginFormProps {
  error?: string
}

export default function LoginForm({ error: initialError }: LoginFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)

  useEffect(() => {
    if (initialError === 'auth_failed') {
      setError('Authentication failed. Please try again.')
    }
  }, [initialError])

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      // The API route will handle the redirect to Google OAuth
      window.location.href = '/api/auth/login'
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-wavelength-card p-8 rounded-2xl shadow-xl">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-gradient-electric rounded-xl px-6 py-4 text-white font-semibold text-base hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
      </button>
      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}
      <p className="mt-6 text-center text-sm text-wavelength-text-muted">
        Only band leaders need to sign in. Bandmates will access via a shared link.
      </p>
    </div>
  )
}

