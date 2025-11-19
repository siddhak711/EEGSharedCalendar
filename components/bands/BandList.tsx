'use client'

import { Band } from '@/types'
import Link from 'next/link'
import { useState } from 'react'

interface BandListProps {
  bands: Band[]
}

export default function BandList({ bands }: BandListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (bandId: string) => {
    if (!confirm('Are you sure you want to delete this band? This action cannot be undone.')) {
      return
    }

    setDeletingId(bandId)
    try {
      const response = await fetch(`/api/bands/${bandId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete band')
      }

      window.location.reload()
    } catch (error) {
      console.error('Error deleting band:', error)
      alert('Failed to delete band. Please try again.')
      setDeletingId(null)
    }
  }

  if (bands.length === 0) {
    return (
      <div className="relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-2xl text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 animate-pulse-slow"></div>
        <p className="relative z-10 text-base sm:text-lg text-gray-400 font-normal">You haven&apos;t created any bands yet. Create your first band above!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {bands.map((band) => (
        <div 
          key={band.id} 
          className="relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden group"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-display font-bold text-white pr-2">{band.name}</h3>
              <span
                className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                  band.calendar_submitted
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}
              >
                {band.calendar_submitted ? 'Submitted' : 'Draft'}
              </span>
            </div>
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <Link
                href={`/band/${band.id}`}
                className="block w-full px-4 py-3 min-h-[44px] bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] active:opacity-90 text-white text-center rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-purple-500/40 touch-manipulation flex items-center justify-center"
              >
                Manage Calendar
              </Link>
              {band.share_token && (
                <Link
                  href={`/band/${band.id}/share`}
                  className="block w-full px-4 py-3 min-h-[44px] bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] active:opacity-90 text-white text-center rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-purple-500/40 touch-manipulation flex items-center justify-center"
                >
                  Share with Bandmates
                </Link>
              )}
            </div>
            <button
              onClick={() => handleDelete(band.id)}
              disabled={deletingId === band.id}
              className="w-full px-4 py-2 min-h-[44px] text-sm text-red-400 hover:text-red-300 active:text-red-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center touch-manipulation"
            >
              {deletingId === band.id ? 'Deleting...' : 'Delete Band'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

