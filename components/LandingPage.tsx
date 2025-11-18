'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { format, getDay } from 'date-fns'
import AvailabilityIndicator from './calendar/AvailabilityIndicator'
import { Band } from '@/types'

// Sample calendar component for landing page with cool animations
function SampleCalendar() {
  const [visibleDates, setVisibleDates] = useState<number[]>([])
  const [simulatedAvailability, setSimulatedAvailability] = useState<Map<number, boolean>>(new Map())
  const [selectedDate, setSelectedDate] = useState<{ date: number; day: string; month: string; dateString: string } | null>(null)
  const [bands, setBands] = useState<Band[]>([])
  const [calendarsByBand, setCalendarsByBand] = useState<Map<string, Map<string, boolean>>>(new Map())
  const [loading, setLoading] = useState(true)

  // Fetch real bands and calendars
  useEffect(() => {
    const fetchBands = async () => {
      try {
        const response = await fetch('/api/public/bands')
        if (!response.ok) throw new Error('Failed to fetch bands')
        
        const data = await response.json()
        setBands(data.bands || [])
        
        // Convert calendarsByBand object back to Map
        const calendarsMap = new Map<string, Map<string, boolean>>()
        Object.entries(data.calendarsByBand || {}).forEach(([bandId, calendarObj]) => {
          const calendar = new Map<string, boolean>()
          Object.entries(calendarObj as Record<string, boolean>).forEach(([date, isAvailable]) => {
            calendar.set(date, isAvailable)
          })
          calendarsMap.set(bandId, calendar)
        })
        setCalendarsByBand(calendarsMap)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching bands:', error)
        setLoading(false)
      }
    }
    
    fetchBands()
  }, [])

  const { currentMonth, weekendDates } = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const dates: Array<{ date: number; day: string; available: boolean; id: number; dateString: string }> = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = getDay(date)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dateString = format(date, 'yyyy-MM-dd')
      
      // Check if any band is available on this date
      let hasAvailableBand = false
      calendarsByBand.forEach((calendar) => {
        if (calendar.get(dateString) === true) {
          hasAvailableBand = true
        }
      })
      
      dates.push({ 
        date: day, 
        day: dayNames[dayOfWeek], 
        available: hasAvailableBand, 
        id: dates.length,
        dateString 
      })
    }
    
    return {
      currentMonth: format(today, 'MMMM yyyy'),
      monthName: format(today, 'MMMM'),
      weekendDates: dates.slice(0, 12) // Show first 12 dates
    }
  }, [calendarsByBand])

  // Get available bands for a date
  const getAvailableBandsForDate = (dateString: string): Band[] => {
    const availableBands: Band[] = []
    
    bands.forEach((band) => {
      const bandCalendar = calendarsByBand.get(band.id)
      if (bandCalendar?.get(dateString) === true) {
        availableBands.push(band)
      }
    })
    
    return availableBands
  }

  const handleDateClick = (item: { date: number; day: string; id: number; available: boolean; dateString: string }) => {
    const isAvailable = simulatedAvailability.get(item.id) ?? item.available
    if (isAvailable) {
      setSelectedDate({ date: item.date, day: item.day, month: currentMonth, dateString: item.dateString })
    }
  }

  const closeModal = () => {
    setSelectedDate(null)
  }

  // Staggered entrance animation
  useEffect(() => {
    weekendDates.forEach((item, idx) => {
      setTimeout(() => {
        setVisibleDates(prev => [...prev, item.id])
        setSimulatedAvailability(prev => new Map(prev.set(item.id, item.available)))
      }, idx * 80)
    })
  }, [weekendDates])

  return (
    <div className="relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 md:p-14 border border-white/20 shadow-2xl overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 animate-pulse-slow"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00A8FF]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
            {currentMonth}
          </h3>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {weekendDates.map((item, idx) => {
            const isVisible = visibleDates.includes(item.id)
            const currentAvailability = simulatedAvailability.get(item.id) ?? item.available
            const delay = idx * 80

            return (
              <div
                key={item.id}
                className={`relative group transition-all duration-500 ease-out ${
                  isVisible 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-4 scale-95'
                }`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                <button
                  onClick={() => handleDateClick(item)}
                  disabled={!currentAvailability}
                  className={`relative w-full p-4 sm:p-5 rounded-2xl border-2 transition-all duration-500 backdrop-blur-sm overflow-hidden ${
                    currentAvailability
                      ? 'border-green-500/50 bg-gradient-to-br from-green-500/20 via-green-500/10 to-green-500/5 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 cursor-pointer active:scale-95'
                      : 'border-red-500/50 bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 shadow-lg shadow-red-500/20 cursor-not-allowed opacity-75'
                  }`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    currentAvailability 
                      ? 'bg-green-500/10' 
                      : 'bg-red-500/10'
                  }`}></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        {item.day}
                      </span>
                      <div className="relative">
                        <AvailabilityIndicator isAvailable={currentAvailability} />
                        {currentAvailability && (
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        )}
                      </div>
                    </div>
                    <div className={`text-2xl sm:text-3xl font-bold transition-colors duration-500 ${
                      currentAvailability ? 'text-white' : 'text-gray-300'
                    }`}>
                      {item.date}
                    </div>
                  </div>

                  {/* Status indicator line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-500 ${
                    currentAvailability 
                      ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' 
                      : 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'
                  }`}></div>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal for showing available bands */}
      {selectedDate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
          onClick={closeModal}
        >
          <div 
            className="relative bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full p-8 sm:p-10 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-8">
              <h3 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
                {selectedDate.day}, {selectedDate.month} {selectedDate.date}
              </h3>
              <p className="text-gray-400 text-sm">Available bands for this date</p>
            </div>

            {/* Available bands list */}
            <div className="space-y-3">
              {selectedDate && getAvailableBandsForDate(selectedDate.dateString).length > 0 ? (
                getAvailableBandsForDate(selectedDate.dateString).map((band, idx) => (
                  <div
                    key={band.id}
                    className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/30 rounded-2xl p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                    style={{ 
                      animation: `fadeInLeft 0.4s ease-out ${idx * 0.1}s both`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">{band.name}</h4>
                        <p className="text-sm text-gray-400">Submitted calendar</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-green-400 font-semibold">Available</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No bands available for this date</p>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <Link
                href="/login"
                className="block w-full text-center bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40"
                onClick={closeModal}
              >
                Sign up to request a bill
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-visible">
      {/* Brand */}
      <div className="fixed top-8 sm:top-10 left-8 sm:left-10 z-50">
        <div className="relative group cursor-default">
          {/* Glow effect */}
          <div 
            className="absolute -inset-2 blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #00A8FF 100%)',
            }}
          />
          <h1 
            className="relative font-bold text-2xl sm:text-5xl tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #00A8FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WaveLength
          </h1>
        </div>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-20 sm:pt-24 pb-12 sm:pb-16 relative overflow-visible">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.2] tracking-tight overflow-visible">
            Fill The Bill.{' '}
            <br />
            <span className="text-[#A78BFA]">Pack The Crowd.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-[#9CA3AF] max-w-[700px] mx-auto leading-relaxed px-2 overflow-visible">
            Sync your band's schedule, find the perfect gig dates, and keep everyone in harmony. 
            The coolest way for bands to manage availability and collaborate on shows.
          </p>

          {/* Primary CTA */}
          <div className="pt-2 sm:pt-4">
            <Link
              href="/login"
              className="inline-block bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 w-full sm:w-auto sm:min-w-[280px] md:min-w-[320px]"
            >
              Sign Up
            </Link>
          </div>

          {/* Email capture instructions */}
          <p className="text-xs sm:text-sm text-[#9CA3AF] pt-1 sm:pt-2 px-4">
            Get started in seconds. Free to use.
          </p>
        </div>
      </section>

      {/* Visual Element Below Hero */}
      <section className="px-4 pb-16 -mt-8">
        <div className="max-w-6xl mx-auto">
          <SampleCalendar />
        </div>
      </section>

      {/* Footer Badge */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <div className="bg-white/10 backdrop-blur-md text-white text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20">
          Made with ♥
        </div>
      </div>
    </div>
  )
}

