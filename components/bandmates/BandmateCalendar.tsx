'use client'

import { useState, useEffect, useMemo } from 'react'
import { getWeekendNightsForNext6Months, groupDatesByMonth, groupDatesByWeeks, formatDateForGrid, getMonthName, normalizeDate } from '@/lib/utils/dateUtils'
import Toast from '@/components/ui/Toast'

interface BandmateCalendarProps {
  token: string
  bandId: string
  bandCalendar: Map<string, boolean>
  initialUnavailability: Map<string, boolean>
  bandName?: string
}

export default function BandmateCalendar({
  token,
  bandId,
  bandCalendar,
  initialUnavailability,
  bandName = 'the band',
}: BandmateCalendarProps) {
  const [unavailability, setUnavailability] = useState<Map<string, boolean>>(new Map(initialUnavailability))
  const [savedUnavailability, setSavedUnavailability] = useState<Map<string, boolean>>(new Map(initialUnavailability))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')

  const weekendNights = getWeekendNightsForNext6Months()
  const datesByMonth = groupDatesByMonth(weekendNights)

  useEffect(() => {
    setUnavailability(new Map(initialUnavailability))
    setSavedUnavailability(new Map(initialUnavailability))
  }, [initialUnavailability])

  // Calculate unsaved changes
  const unsavedChanges = useMemo(() => {
    const changes: Array<{ date: string; is_unavailable: boolean }> = []
    const allDates = new Set([
      ...Array.from(unavailability.keys()),
      ...Array.from(savedUnavailability.keys())
    ])

    for (const date of allDates) {
      const current = unavailability.get(date) ?? false
      const saved = savedUnavailability.get(date) ?? false
      if (current !== saved) {
        changes.push({ date, is_unavailable: current })
      }
    }

    return changes
  }, [unavailability, savedUnavailability])

  const hasUnsavedChanges = unsavedChanges.length > 0

  const toggleUnavailability = (date: string) => {
    const currentUnavailability = unavailability.get(date) ?? false
    const newUnavailability = !currentUnavailability

    // Only update local state - no API call
    setUnavailability(new Map(unavailability.set(date, newUnavailability)))
    setError(null)
  }

  const submitChanges = async () => {
    if (!hasUnsavedChanges || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Submit all changes in parallel, but track each result
      const submissionPromises = unsavedChanges.map(async ({ date, is_unavailable }) => {
        const normalizedDate = normalizeDate(date)
      const response = await fetch('/api/bandmate-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
            date: normalizedDate,
            is_unavailable,
        }),
      })

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to update availability for ${date}`)
        }

        const result = await response.json()
        return { date: normalizedDate, is_unavailable, success: true, id: result.id }
      })

      const results = await Promise.all(submissionPromises)

      // Verify all submissions succeeded
      const failures = results.filter(r => !r.success)
      if (failures.length > 0) {
        throw new Error(`${failures.length} update(s) failed. Please try again.`)
      }

      // Verify the changes were actually saved with retry logic
      // This ensures read-after-write consistency and catches any partial failures
      const verifyWithRetry = async (attempt: number, maxAttempts: number): Promise<Map<string, boolean> | null> => {
        // Exponential backoff: 200ms, 400ms, 800ms
        const delay = 200 * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))

      try {
        const verifyResponse = await fetch(`/api/bandmate-availability?token=${encodeURIComponent(token)}`)
          if (!verifyResponse.ok) {
            if (attempt < maxAttempts) {
              return verifyWithRetry(attempt + 1, maxAttempts)
            }
            return null
          }

          const verifyData = await verifyResponse.json()
          const verifiedAvailability = new Map<string, boolean>()
          
          if (verifyData.availability && Array.isArray(verifyData.availability)) {
            verifyData.availability.forEach((item: { date: string | Date; is_unavailable: boolean }) => {
              const dateKey = normalizeDate(item.date)
              verifiedAvailability.set(dateKey, item.is_unavailable)
            })
          }

          // Verify all submitted dates match what was saved
          let allVerified = true
          const missingDates: string[] = []
          const mismatchedDates: string[] = []
          
          unsavedChanges.forEach(({ date, is_unavailable }) => {
            const normalizedDate = normalizeDate(date)
            const savedValue = verifiedAvailability.get(normalizedDate)
            
            if (savedValue === undefined) {
              allVerified = false
                missingDates.push(normalizedDate)
            } else if (savedValue !== is_unavailable) {
              allVerified = false
              mismatchedDates.push(normalizedDate)
            }
          })

          if (allVerified) {
            // All changes verified - return verified data
            return verifiedAvailability
          } else {
            // Some changes didn't verify - retry if attempts remain
            if (attempt < maxAttempts) {
              console.warn(`Verification attempt ${attempt} failed. Missing: ${missingDates.join(', ')}, Mismatched: ${mismatchedDates.join(', ')}. Retrying...`)
              return verifyWithRetry(attempt + 1, maxAttempts)
            }
            // All retries exhausted - return null to indicate failure
            console.error(`Verification failed after ${maxAttempts} attempts. Missing: ${missingDates.join(', ')}, Mismatched: ${mismatchedDates.join(', ')}`)
            return null
          }
        } catch (verifyErr) {
          if (attempt < maxAttempts) {
            console.warn(`Verification attempt ${attempt} error:`, verifyErr)
            return verifyWithRetry(attempt + 1, maxAttempts)
          }
          console.error('Error verifying saved changes after all retries:', verifyErr)
          return null
        }
      }

      // Attempt verification with 3 retries
      const verifiedAvailability = await verifyWithRetry(1, 3)

      if (verifiedAvailability !== null) {
        // All changes verified - use verified data which may include other existing entries
        setSavedUnavailability(verifiedAvailability)
        // Also sync local unavailability to match verified state for consistency
        setUnavailability(new Map(verifiedAvailability))
      
      // Show success message
      setToastMessage(`Your changes have been saved and will appear on ${bandName}'s calendar.`)
      setToastType('success')
      setShowToast(true)
      } else {
        // Verification failed after all retries - don't update state, show error
        throw new Error('Unable to verify that your changes were saved. Please refresh the page and try again. Your changes are still pending.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving changes'
      setError(errorMessage)
      setToastMessage(errorMessage)
      setToastType('error')
      setShowToast(true)
      // Don't update saved state on error - keep unsaved changes visible
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDateUnsaved = (date: string) => {
    const current = unavailability.get(date) ?? false
    const saved = savedUnavailability.get(date) ?? false
    return current !== saved
  }

  const getDayName = (date: string) => {
    // Parse as local date to avoid timezone shifts
    const [year, month, day] = date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayOfWeek = dateObj.getDay()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayNames[dayOfWeek]
  }

  const getDateStatus = (date: string) => {
    const isBandAvailable = bandCalendar.get(date) ?? true
    const isUnavailable = unavailability.get(date) ?? false

    if (!isBandAvailable) {
      return { status: 'band-unavailable', label: 'Band Unavailable' }
    }
    if (isUnavailable) {
      return { status: 'unavailable', label: 'You Unavailable' }
    }
    return { status: 'available', label: 'Available' }
  }

  return (
    <div className="space-y-10">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          duration={5000}
        />
      )}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}
      
      {/* Submit Button - Prominent placement */}
      <div className="sticky top-4 z-10 mb-6">
        <div className="bg-wavelength-card rounded-2xl shadow-xl p-4 border border-wavelength-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {hasUnsavedChanges ? (
                <p className="text-sm text-wavelength-text-muted">
                  <span className="font-semibold text-wavelength-text">{unsavedChanges.length}</span> unsaved change{unsavedChanges.length !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-sm text-wavelength-text-muted">
                  All changes saved
                </p>
              )}
            </div>
            <button
              onClick={submitChanges}
              disabled={!hasUnsavedChanges || isSubmitting}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                hasUnsavedChanges && !isSubmitting
                  ? 'bg-gradient-electric text-white hover:opacity-90 shadow-lg hover:shadow-xl'
                  : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
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
                  Submitting...
                </span>
              ) : (
                `Submit Changes${hasUnsavedChanges ? ` (${unsavedChanges.length})` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-wavelength-light/30 border border-wavelength-primary/20 rounded-xl">
        <p className="text-sm text-wavelength-text-muted font-normal">
          <strong className="text-wavelength-text">Legend:</strong>{' '}
          <span className="inline-flex items-center gap-2 ml-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> Available
          </span>
          {' '}
          <span className="inline-flex items-center gap-2 ml-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> You Unavailable
          </span>
          {' '}
          <span className="inline-flex items-center gap-2 ml-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Band Unavailable
          </span>
        </p>
      </div>
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
                    const { status, label } = getDateStatus(date)
                    const isBandUnavailable = !(bandCalendar.get(date) ?? true)
                    const hasUnsavedChange = isDateUnsaved(date)
                    
                    return (
                      <button
                        key={date}
                        onClick={() => !isBandUnavailable && toggleUnavailability(date)}
                        disabled={isBandUnavailable || isSubmitting}
                        className={`relative p-4 rounded-xl border transition-all ${
                          isBandUnavailable
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-wavelength-primary/50'
                        } ${
                          status === 'available'
                            ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                            : status === 'unavailable'
                            ? 'border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20'
                            : 'border-red-500/30 bg-red-500/10'
                        } ${
                          hasUnsavedChange
                            ? 'ring-2 ring-wavelength-primary/50 ring-offset-2 ring-offset-wavelength-card animate-pulse'
                            : ''
                        } ${isSubmitting ? 'opacity-50' : ''}`}
                        title={hasUnsavedChange ? `${label} (Unsaved)` : label}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-wavelength-text">
                            {getDayName(date)}
                          </span>
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${
                              status === 'available'
                                ? 'bg-green-500'
                                : status === 'unavailable'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            aria-label={label}
                          />
                        </div>
                        <div className="text-lg font-bold text-wavelength-text">
                          {formatDateForGrid(date)}
                        </div>
                        {hasUnsavedChange && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-wavelength-primary rounded-full animate-pulse"></div>
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
      <div className="mt-6 p-4 bg-wavelength-light/30 border border-wavelength-primary/20 rounded-xl">
        <p className="text-sm text-wavelength-text-muted font-normal">
          <strong className="text-wavelength-text">Tip:</strong> Click on any date to mark when you&apos;re unavailable. Remember to click &quot;Submit Changes&quot; to save your updates. Dates marked as unavailable by the band leader cannot be changed.
        </p>
      </div>
    </div>
  )
}

