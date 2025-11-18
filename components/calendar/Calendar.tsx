'use client'

import { useState, useEffect, useCallback } from 'react'
import { getWeekendNightsForNext6Months, groupDatesByMonth, groupDatesByWeeks, formatDateForGrid, getMonthName } from '@/lib/utils/dateUtils'
import AvailabilityIndicator from './AvailabilityIndicator'

interface CalendarProps {
  bandId: string
  initialAvailability: Map<string, boolean>
  readOnly?: boolean
  showRefreshButton?: boolean
}

export default function Calendar({ bandId, initialAvailability, readOnly = false, showRefreshButton = false }: CalendarProps) {
  const [availability, setAvailability] = useState<Map<string, boolean>>(initialAvailability)
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const weekendNights = getWeekendNightsForNext6Months()
  const datesByMonth = groupDatesByMonth(weekendNights)

  useEffect(() => {
    setAvailability(initialAvailability)
  }, [initialAvailability])

  // Refresh calendar data from API
  const refreshCalendarData = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const response = await fetch(`/api/calendar/band/${bandId}`)
      if (!response.ok) {
        throw new Error('Failed to refresh calendar data')
      }
      const data = await response.json()
      
      // Convert Record to Map
      const availabilityMap = new Map<string, boolean>()
      Object.entries(data.availability || {}).forEach(([date, isAvailable]) => {
        availabilityMap.set(date, isAvailable as boolean)
      })
      
      setAvailability(availabilityMap)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing calendar data:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh calendar')
    } finally {
      setIsRefreshing(false)
    }
  }, [bandId])

  // Automatic polling - refresh every 45 seconds (only if showRefreshButton is true)
  useEffect(() => {
    if (!showRefreshButton) return

    const intervalId = setInterval(() => {
      // Only poll if page is visible
      if (!document.hidden) {
        refreshCalendarData()
      }
    }, 45000) // 45 seconds

    return () => clearInterval(intervalId)
  }, [refreshCalendarData, showRefreshButton])

  // Pause polling when page is hidden
  useEffect(() => {
    if (!showRefreshButton) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, polling is paused (handled by the interval check)
      } else {
        // Page is visible, refresh immediately if data is stale (> 60 seconds old)
        if (lastUpdated) {
          const secondsSinceUpdate = (new Date().getTime() - lastUpdated.getTime()) / 1000
          if (secondsSinceUpdate > 60) {
            refreshCalendarData()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [lastUpdated, refreshCalendarData, showRefreshButton])

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
      
      // After updating, refresh the calendar to get updated bandmate availability
      if (showRefreshButton) {
        // Small delay to ensure database has updated
        setTimeout(() => {
          refreshCalendarData()
        }, 500)
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
      {showRefreshButton && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {lastUpdated && (
              <p className="text-xs text-wavelength-text-muted">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={refreshCalendarData}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-wavelength-primary/20 backdrop-blur-sm border border-wavelength-primary/30 text-wavelength-text hover:bg-wavelength-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            title="Refresh calendar to see bandmate availability updates"
          >
            {isRefreshing ? (
              <svg
                className="animate-spin h-4 w-4"
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
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}
      {Object.entries(datesByMonth).map(([monthKey, dates]) => {
        const weeks = groupDatesByWeeks(dates)
        return (
          <div key={monthKey} className="border-b border-wavelength-primary/10 pb-10 last:border-b-0">
            <h3 className="text-2xl font-display font-bold text-wavelength-text mb-6">
              {getMonthName(dates[0])}
            </h3>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-wavelength-text-muted py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar weeks */}
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((date, dayIndex) => {
                    if (date === null) {
                      return <div key={dayIndex} className="p-4 rounded-xl" />
                    }
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
              ))}
            </div>
          </div>
        )
      })}
      {!readOnly && (
        <div className="mt-6 p-4 bg-wavelength-light/30 border border-wavelength-primary/20 rounded-xl">
          <p className="text-sm text-wavelength-text-muted font-normal">
            <strong className="text-wavelength-text">Tip:</strong> Click on any date to toggle availability. Green indicates available, red indicates unavailable. This calendar shows your band's availability including bandmate unavailability - dates will appear red if any bandmate is unavailable.
            {showRefreshButton && (
              <> Click the refresh button to see the latest bandmate availability updates.</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

