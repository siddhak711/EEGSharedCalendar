'use client'

import { useState, useEffect } from 'react'
import { getWeekendNightsForNext6Months, groupDatesByMonth, formatDateForGrid, getMonthName } from '@/lib/utils/dateUtils'
import AvailabilityIndicator from './AvailabilityIndicator'

interface CalendarProps {
  bandId: string
  initialAvailability: Map<string, boolean>
  readOnly?: boolean
}

export default function Calendar({ bandId, initialAvailability, readOnly = false }: CalendarProps) {
  const [availability, setAvailability] = useState<Map<string, boolean>>(initialAvailability)
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const weekendNights = getWeekendNightsForNext6Months()
  const datesByMonth = groupDatesByMonth(weekendNights)

  useEffect(() => {
    setAvailability(initialAvailability)
  }, [initialAvailability])

  const toggleAvailability = async (date: string) => {
    if (readOnly) return

    const currentAvailability = availability.get(date) ?? true
    const newAvailability = !currentAvailability

    // Optimistic update
    setAvailability(new Map(availability.set(date, newAvailability)))
    setLoading(new Set(loading).add(date))
    setError(null)

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          band_id: bandId,
          date,
          is_available: newAvailability,
        }),
      })

      if (!response.ok) {
        // Revert on error
        setAvailability(new Map(availability.set(date, currentAvailability)))
        throw new Error('Failed to update availability')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Revert on error
      setAvailability(new Map(availability.set(date, currentAvailability)))
    } finally {
      const newLoading = new Set(loading)
      newLoading.delete(date)
      setLoading(newLoading)
    }
  }

  const getDayName = (date: string) => {
    const day = new Date(date).getDay()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayNames[day]
  }

  return (
    <div className="space-y-10">
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}
      {Object.entries(datesByMonth).map(([monthKey, dates]) => (
        <div key={monthKey} className="border-b border-wavelength-primary/10 pb-10 last:border-b-0">
          <h3 className="text-2xl font-display font-bold text-wavelength-text mb-6">
            {getMonthName(dates[0])}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dates.map((date) => {
              const isAvailable = availability.get(date) ?? true
              const isLoading = loading.has(date)
              
              return (
                <button
                  key={date}
                  onClick={() => toggleAvailability(date)}
                  disabled={readOnly || isLoading}
                  className={`relative p-4 rounded-xl border transition-all ${
                    readOnly
                      ? 'cursor-default'
                      : 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-wavelength-primary/50'
                  } ${
                    isAvailable
                      ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                      : 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                  } ${isLoading ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-wavelength-text">
                      {getDayName(date)}
                    </span>
                    <AvailabilityIndicator isAvailable={isAvailable} />
                  </div>
                  <div className="text-lg font-bold text-wavelength-text">
                    {formatDateForGrid(date)}
                  </div>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-wavelength-light/50 backdrop-blur-sm rounded-xl">
                      <svg
                        className="animate-spin h-5 w-5 text-wavelength-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {!readOnly && (
        <div className="mt-6 p-4 bg-wavelength-light/30 border border-wavelength-primary/20 rounded-xl">
          <p className="text-sm text-wavelength-text-muted font-normal">
            <strong className="text-wavelength-text">Tip:</strong> Click on any date to toggle availability. Green indicates available, red indicates unavailable.
          </p>
        </div>
      )}
    </div>
  )
}

