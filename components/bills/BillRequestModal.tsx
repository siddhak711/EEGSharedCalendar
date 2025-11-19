'use client'

import { useState, useEffect } from 'react'
import { Band } from '@/types'
import { formatDateForDisplay } from '@/lib/utils/dateUtils'
import { useRouter } from 'next/navigation'

interface BillRequestModalProps {
  date: string
  targetBand: Band
  onClose: () => void
  currentUserId: string
}

export default function BillRequestModal({
  date,
  targetBand,
  onClose,
  currentUserId,
}: BillRequestModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null)
  const [userBands, setUserBands] = useState<Band[]>([])
  const [bandsLoading, setBandsLoading] = useState(true)

  // Fetch user's bands when modal opens
  useEffect(() => {
    const fetchBands = async () => {
      try {
        const response = await fetch('/api/bands')
        if (response.ok) {
          const data = await response.json()
          const submittedBands = (data.bands || []).filter((band: Band) => band.calendar_submitted)
          setUserBands(submittedBands)
          if (submittedBands.length > 0) {
            setSelectedBandId(submittedBands[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching bands:', err)
      } finally {
        setBandsLoading(false)
      }
    }
    fetchBands()
  }, [])

  const handleSubmit = async () => {
    if (!selectedBandId) {
      setError('Please select a band')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesting_band_id: selectedBandId,
          target_band_id: targetBand.id,
          date,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create bill request')
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  if (bandsLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-wavelength-card rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <p className="text-wavelength-text-muted font-normal">Loading...</p>
        </div>
      </div>
    )
  }

  if (userBands.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-wavelength-card rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg sm:text-xl font-display font-bold text-wavelength-text mb-4">No Submitted Bands</h2>
          <p className="text-sm sm:text-base text-wavelength-text-muted mb-6 font-normal">
            You need to submit at least one band&apos;s calendar before requesting to join a bill.
          </p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 min-h-[44px] bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:opacity-90 active:opacity-80 font-semibold transition-all duration-200 touch-manipulation"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-wavelength-card rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 my-auto max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-wavelength-text mb-4 sm:mb-6">Request to Join Bill</h2>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-wavelength-text-muted mb-2">
              Date
            </label>
            <p className="text-sm sm:text-base text-wavelength-text font-semibold">{formatDateForDisplay(date)}</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-wavelength-text-muted mb-2">
              Target Band
            </label>
            <p className="text-sm sm:text-base text-wavelength-text font-semibold">{targetBand.name}</p>
          </div>
          <div>
            <label htmlFor="band-select" className="block text-xs sm:text-sm font-medium text-wavelength-text-muted mb-2 sm:mb-3">
              Your Band
            </label>
            <select
              id="band-select"
              value={selectedBandId || ''}
              onChange={(e) => setSelectedBandId(e.target.value)}
              className="w-full px-4 py-3 min-h-[44px] bg-wavelength-light/50 border border-wavelength-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-wavelength-primary/50 focus:border-wavelength-primary text-wavelength-text font-normal text-sm sm:text-base touch-manipulation"
            >
              {userBands.map((band) => (
                <option key={band.id} value={band.id} className="bg-wavelength-light">
                  {band.name}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs sm:text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 min-h-[44px] bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedBandId}
              className="flex-1 px-6 py-3 min-h-[44px] bg-gradient-electric text-white rounded-xl hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 touch-manipulation"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

