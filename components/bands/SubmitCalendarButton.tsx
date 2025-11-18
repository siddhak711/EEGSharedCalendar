'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface SubmitCalendarButtonProps {
  bandId: string
}

export default function SubmitCalendarButton({ bandId }: SubmitCalendarButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmitClick = () => {
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
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
        onClick={handleSubmitClick}
        disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-green-500/40"
      >
        {loading ? 'Submitting...' : 'Submit Calendar'}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-400 font-medium">{error}</p>
      )}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title="Submit Calendar"
        message="Once submitted, your calendar will be visible to other band leaders. You can still update availability, but the calendar will remain visible. Continue?"
        confirmText="Continue"
        cancelText="Cancel"
        isLoading={loading}
      />
    </div>
  )
}

