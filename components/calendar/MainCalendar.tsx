'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Band } from '@/types'
import { getWeekendNightsForNext6Months, groupDatesByMonth, groupDatesByWeeks, formatDateForGrid, getMonthName } from '@/lib/utils/dateUtils'
import BillRequestModal from '@/components/bills/BillRequestModal'

interface MainCalendarProps {
  bands: Band[]
  calendarsByBand: Map<string, Map<string, boolean>>
  bandColors: Map<string, string>
  currentUserId: string
  userBands: Band[]
}

interface CalendarData {
  bands: Band[]
  calendarsByBand: Record<string, Record<string, boolean>>
  bandColors: Record<string, string>
  currentUserId: string
  userBands: Band[]
}

export default function MainCalendar({
  bands: initialBands,
  calendarsByBand: initialCalendarsByBand,
  bandColors: initialBandColors,
  currentUserId,
  userBands: initialUserBands,
}: MainCalendarProps) {
  const [bands, setBands] = useState<Band[]>(initialBands)
  const [calendarsByBand, setCalendarsByBand] = useState<Map<string, Map<string, boolean>>>(initialCalendarsByBand)
  const [bandColors, setBandColors] = useState<Map<string, string>>(initialBandColors)
  const [userBands, setUserBands] = useState<Band[]>(initialUserBands)
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBand, setSelectedBand] = useState<Band | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [clickedDate, setClickedDate] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const weekendNights = getWeekendNightsForNext6Months()
  const datesByMonth = groupDatesByMonth(weekendNights)
  const monthEntries = Object.entries(datesByMonth)
  const currentMonth = monthEntries[currentMonthIndex]
  const [currentMonthKey, currentMonthDates] = currentMonth || ['', []]

  const getDayName = (date: string) => {
    const day = new Date(date).getDay()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayNames[day]
  }

  const handleDateClick = (date: string, bandId?: string) => {
    const availableBands = getAvailableBandsForDate(date)
    
    if (availableBands.length === 0) return
    
    // If a specific band is selected, open modal for that band
    if (bandId) {
      const band = bands.find((b) => b.id === bandId)
      if (!band) return

      const bandCalendar = calendarsByBand.get(bandId)
      const isAvailable = bandCalendar?.get(date) ?? false

      if (isAvailable && band.leader_id !== currentUserId) {
        setSelectedDate(date)
        setSelectedBand(band)
        setShowModal(true)
        setClickedDate(null)
      }
    } else {
      // If only one band, open modal directly
      if (availableBands.length === 1) {
        const band = availableBands[0]
        if (band.leader_id !== currentUserId) {
          setSelectedDate(date)
          setSelectedBand(band)
          setShowModal(true)
          setClickedDate(null)
        }
      } else {
        // Multiple bands - show selection
        setClickedDate(clickedDate === date ? null : date)
      }
    }
  }

  const getAvailableBandsForDate = (date: string): Band[] => {
    const userBandIds = new Set(userBands.map((band) => band.id))
    return bands.filter((band) => {
      // Don't show user's own bands
      if (userBandIds.has(band.id)) return false
      const bandCalendar = calendarsByBand.get(band.id)
      return bandCalendar?.get(date) === true
    })
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDate(null)
    setSelectedBand(null)
    setClickedDate(null)
  }

  const goToPreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonthIndex < monthEntries.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1)
    }
  }

  // Convert Record format to Map format
  const convertCalendarData = useCallback((data: CalendarData) => {
    const calendarsByBandMap = new Map<string, Map<string, boolean>>()
    Object.entries(data.calendarsByBand).forEach(([bandId, dateMap]) => {
      const dateMapObj = new Map<string, boolean>()
      Object.entries(dateMap).forEach(([date, isAvailable]) => {
        dateMapObj.set(date, isAvailable)
      })
      calendarsByBandMap.set(bandId, dateMapObj)
    })

    const bandColorsMap = new Map<string, string>()
    Object.entries(data.bandColors).forEach(([bandId, color]) => {
      bandColorsMap.set(bandId, color)
    })

    return {
      bands: data.bands,
      calendarsByBand: calendarsByBandMap,
      bandColors: bandColorsMap,
      userBands: data.userBands,
    }
  }, [])

  // Refresh calendar data from API
  const refreshCalendarData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/calendar/main')
      if (!response.ok) {
        throw new Error('Failed to refresh calendar data')
      }
      const data: CalendarData = await response.json()
      
      const converted = convertCalendarData(data)
      setBands(converted.bands)
      setCalendarsByBand(converted.calendarsByBand)
      setBandColors(converted.bandColors)
      setUserBands(converted.userBands)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing calendar data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [convertCalendarData])

  // Automatic polling - refresh every 45 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only poll if page is visible
      if (!document.hidden) {
        refreshCalendarData()
      }
    }, 45000) // 45 seconds

    return () => clearInterval(intervalId)
  }, [refreshCalendarData])

  // Pause polling when page is hidden
  useEffect(() => {
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
  }, [lastUpdated, refreshCalendarData])

  // Close clicked date tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clickedDate && calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setClickedDate(null)
      }
    }

    if (clickedDate) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [clickedDate])

  if (!currentMonth) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation with Refresh Button */}
      <div className="relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 animate-pulse-slow"></div>
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            disabled={currentMonthIndex === 0}
            className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-3xl font-display font-bold text-white">
              {getMonthName(currentMonthDates[0])}
            </h3>
            {lastUpdated && (
              <p className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refreshCalendarData}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
              title="Refresh calendar data"
            >
              {isRefreshing ? (
                <svg
                  className="animate-spin h-5 w-5"
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
            <button
              onClick={goToNextMonth}
              disabled={currentMonthIndex === monthEntries.length - 1}
              className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Current Month Calendar */}
      <div 
        ref={calendarRef}
        key={currentMonthKey}
        className="relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/20 shadow-2xl overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00A8FF]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-300 py-2">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar weeks */}
          <div className="space-y-2">
            {groupDatesByWeeks(currentMonthDates).map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((date, dayIndex) => {
                  if (date === null) {
                    return <div key={dayIndex} className="p-5 rounded-2xl" />
                  }
                  const availableBands = getAvailableBandsForDate(date)
                  const hasAvailableBands = availableBands.length > 0

                  const isHovered = hoveredDate === date
                  const isClicked = clickedDate === date
                  const showBandList = hasAvailableBands && (isHovered || isClicked)

                  return (
                    <div
                      key={date}
                      className="relative"
                      onMouseEnter={() => hasAvailableBands && setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      <button
                        onClick={() => hasAvailableBands && handleDateClick(date)}
                        disabled={!hasAvailableBands}
                        className={`relative w-full p-5 rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm overflow-visible group ${
                          hasAvailableBands
                            ? 'border-green-500/50 bg-gradient-to-br from-green-500/20 via-green-500/10 to-green-500/5 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 cursor-pointer'
                            : 'border-red-500/50 bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 cursor-default'
                        }`}
                      >
                        {/* Shimmer effect */}
                        {hasAvailableBands && (
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        )}
                        
                        <div className="relative z-10">
                          <div className="mb-3">
                            <span className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                              hasAvailableBands ? 'text-white' : 'text-red-200'
                            }`}>
                              {getDayName(date)}
                            </span>
                          </div>
                          <div className={`text-2xl font-bold transition-colors duration-300 ${
                            hasAvailableBands ? 'text-white' : 'text-red-200'
                          }`}>
                            {formatDateForGrid(date)}
                          </div>
                        </div>

                        {/* Status indicator line */}
                        {hasAvailableBands && (
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-green-500 via-green-400 to-green-500 rounded-full"></div>
                        )}
                        {!hasAvailableBands && (
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-500 rounded-full"></div>
                        )}
                      </button>

                      {/* Hover/Click tooltip showing available bands */}
                      {showBandList && availableBands.length > 0 && (
                        <div 
                          className="absolute z-50 mt-2 w-64 bg-black/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl p-4"
                          style={{
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: 'calc(100% + 0.5rem)',
                            pointerEvents: isClicked ? 'auto' : 'auto'
                          }}
                          onMouseEnter={() => hasAvailableBands && setHoveredDate(date)}
                          onMouseLeave={() => !isClicked && setHoveredDate(null)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                            Available Bands:
                          </div>
                          <div className="space-y-2">
                            {availableBands.map((band) => (
                              <button
                                key={band.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDateClick(date, band.id)
                                }}
                                className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${bandColors.get(band.id)}`}
                              >
                                {band.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {showModal && selectedDate && selectedBand && (
        <BillRequestModal
          date={selectedDate}
          targetBand={selectedBand}
          onClose={closeModal}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}

