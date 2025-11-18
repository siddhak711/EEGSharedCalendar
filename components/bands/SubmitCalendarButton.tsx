'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SubmitCalendarButtonProps {
  bandId: string
}

export default function SubmitCalendarButton({ bandId }: SubmitCalendarButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!confirm('Once submitted, your calendar will be visible to other band leaders. You can still update availability, but the calendar will remain visible. Continue?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bands/${bandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendar_submitted: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit calendar')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200"
      >
        {loading ? 'Submitting...' : 'Submit Calendar'}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-400 font-medium">{error}</p>
      )}
    </div>
  )
}

