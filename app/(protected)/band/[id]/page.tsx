import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Calendar from '@/components/calendar/Calendar'
import Navbar from '@/components/navbar/Navbar'
import SubmitCalendarButton from '@/components/bands/SubmitCalendarButton'
import { normalizeDate } from '@/lib/utils/dateUtils'

export default async function BandCalendarPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getAuthenticatedUser()
  const supabase = createClient()

  // Fetch the band
  const { data: band, error: bandError } = await supabase
    .from('bands')
    .select('*')
    .eq('id', params.id)
    .eq('leader_id', user.id)
    .single()

  if (bandError || !band) {
    notFound()
  }

  // Fetch the band's calendar with bandmate availability factored in
  const { data: finalAvailability, error: availabilityError } = await supabase.rpc(
    'get_band_availability_with_bandmates',
    { p_band_id: params.id }
  )

  let calendarMap: Map<string, boolean>

  if (availabilityError) {
    console.error('Error fetching final availability:', availabilityError)
    // Fallback to regular calendar if function fails
    const { data: calendar, error: calendarError } = await supabase
      .from('band_calendars')
      .select('*')
      .eq('band_id', params.id)
      .order('date', { ascending: true })

    if (calendarError) {
      console.error('Error fetching calendar:', calendarError)
    }

    calendarMap = new Map(
      (calendar || []).map((item) => [normalizeDate(item.date), item.is_available])
    )
  } else {
    calendarMap = new Map(
      (finalAvailability || []).map((avail: { date: string | Date; is_available: boolean }) => [
        normalizeDate(avail.date),
        avail.is_available,
      ])
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-wavelength-text">{band.name}</h2>
                {band.calendar_submitted && (
                  <span className="px-2 sm:px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
                    Submitted
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg text-wavelength-text-muted font-normal">
                Manage your band&apos;s availability. Click on dates to toggle availability.
              </p>
            </div>
            {!band.calendar_submitted && (
              <div className="sm:flex-shrink-0">
                <SubmitCalendarButton bandId={band.id} />
              </div>
            )}
          </div>
        </div>

        <div className="bg-wavelength-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <Calendar
            bandId={band.id}
            initialAvailability={calendarMap}
            readOnly={false}
            showRefreshButton={true}
          />
        </div>
      </main>
    </div>
  )
}

