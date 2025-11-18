'use client'

import { useState } from 'react'
import { Band } from '@/types'
import { getWeekendNightsForNext6Months, groupDatesByMonth, formatDateForGrid, getMonthName } from '@/lib/utils/dateUtils'
import BillRequestModal from '@/components/bills/BillRequestModal'

interface MainCalendarProps {
  bands: Band[]
  calendarsByBand: Map<string, Map<string, boolean>>
  bandColors: Map<string, string>
  currentUserId: string
  userBands: Band[]
}

export default function MainCalendar({
  bands,
  calendarsByBand,
  bandColors,
  currentUserId,
  userBands,
}: MainCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBand, setSelectedBand] = useState<Band | null>(null)
  const [showModal, setShowModal] = useState(false)

  const weekendNights = getWeekendNightsForNext6Months()
  const datesByMonth = groupDatesByMonth(weekendNights)

  const getDayName = (date: string) => {
    const day = new Date(date).getDay()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayNames[day]
  }

  const handleDateClick = (date: string, bandId: string) => {
    const band = bands.find((b) => b.id === bandId)
    if (!band) return

    const bandCalendar = calendarsByBand.get(bandId)
    const isAvailable = bandCalendar?.get(date) ?? false

    if (isAvailable && band.leader_id !== currentUserId) {
      setSelectedDate(date)
      setSelectedBand(band)
      setShowModal(true)
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
  }

  return (
    <div className="space-y-10">
      {Object.entries(datesByMonth).map(([monthKey, dates]) => (
        <div key={monthKey} className="border-b border-wavelength-primary/10 pb-10 last:border-b-0">
          <h3 className="text-2xl font-display font-bold text-wavelength-text mb-6">
            {getMonthName(dates[0])}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dates.map((date) => {
              const availableBands = getAvailableBandsForDate(date)
              const hasAvailableBands = availableBands.length > 0

              return (
                <div
                  key={date}
                  className={`p-4 rounded-xl border transition-all ${
                    hasAvailableBands
                      ? 'border-wavelength-primary/30 bg-wavelength-primary/10 hover:bg-wavelength-primary/20 hover:shadow-lg'
                      : 'border-wavelength-text-muted/20 bg-wavelength-light/20'
                  }`}
                >
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-wavelength-text">
                      {getDayName(date)}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-wavelength-text mb-3">
                    {formatDateForGrid(date)}
                  </div>
                  {hasAvailableBands ? (
                    <div className="space-y-2">
                      <p className="text-xs text-wavelength-text-muted mb-2 font-medium">Available bands:</p>
                      {availableBands.slice(0, 3).map((band) => (
                        <button
                          key={band.id}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer hover:opacity-90 transition-all ${bandColors.get(band.id)}`}
                          onClick={() => handleDateClick(date, band.id)}
                        >
                          {band.name}
                        </button>
                      ))}
                      {availableBands.length > 3 && (
                        <p className="text-xs text-wavelength-text-muted font-medium">
                          +{availableBands.length - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-wavelength-text-muted font-medium">No bands available</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
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

