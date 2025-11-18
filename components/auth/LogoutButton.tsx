'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
      setLoading(false)
    }
  }

  return (
    <div 
      className="relative inline-block rounded-xl p-[2px]"
      style={{
        background: 'linear-gradient(135deg, #14b8a6, #0ea5e9, #8b5cf6, #ec4899, #f97316, #eab308)',
      }}
    >
      <button
        onClick={handleLogout}
        disabled={loading}
        className="relative px-6 py-2.5 text-sm font-medium text-white rounded-xl bg-black/60 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-black/80"
      >
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  )
}

