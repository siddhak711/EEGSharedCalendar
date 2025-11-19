import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import MainCalendar from '@/components/calendar/MainCalendar'
import { normalizeDate } from '@/lib/utils/dateUtils'
import { Band } from '@/types'

export default async function MainCalendarPage() {
  const user = await getAuthenticatedUser()
  const supabase = createClient()

  // Fetch all submitted bands
  const { data: bands, error: bandsError } = await supabase
    .from('bands')
    .select('*')
    .eq('calendar_submitted', true)
    .order('name', { ascending: true })
    .returns<Band[]>()

  if (bandsError) {
    console.error('Error fetching bands:', bandsError)
  }

  // Fetch calendars for all submitted bands
  const bandIds = (bands || []).map((band) => band.id)
  const { data: calendars, error: calendarsError } = await supabase
    .from('band_calendars')
    .select('*')
    .in('band_id', bandIds.length > 0 ? bandIds : ['00000000-0000-0000-0000-000000000000'])
    .order('date', { ascending: true })

  if (calendarsError) {
    console.error('Error fetching calendars:', calendarsError)
  }

  // Group calendars by band, considering bandmate availability
  const calendarsByBand = new Map<string, Map<string, boolean>>()
  
  // Use database function to get final availability (band calendar + bandmate unavailability)
  for (const band of bands || []) {
    const { data: finalAvailability, error: availabilityError } = await supabase.rpc(
      'get_band_availability_with_bandmates',
      { p_band_id: band.id }
    )

    if (availabilityError) {
      console.error(`Error fetching final availability for band ${band.id}:`, availabilityError)
      // Fallback to regular calendar if function fails
      const bandCalendar = new Map<string, boolean>()
      ;(calendars || [])
        .filter((cal) => cal.band_id === band.id)
        .forEach((cal) => {
          bandCalendar.set(normalizeDate(cal.date), cal.is_available)
        })
      calendarsByBand.set(band.id, bandCalendar)
    } else {
      const bandCalendar = new Map<string, boolean>()
      ;(finalAvailability || []).forEach((avail: { date: string | Date; is_available: boolean }) => {
        bandCalendar.set(normalizeDate(avail.date), avail.is_available)
      })
      calendarsByBand.set(band.id, bandCalendar)
    }
  }

  // Get user's bands
  const { data: userBands, error: userBandsError } = await supabase
    .from('bands')
    .select('*')
    .eq('leader_id', user.id)
    .eq('calendar_submitted', true)
    .returns<Band[]>()

  if (userBandsError) {
    console.error('Error fetching user bands:', userBandsError)
  }

  // Generate unique colors for each band - purple variations
  const colors = [
    'bg-gradient-electric border-wavelength-primary/50 text-white',
    'bg-gradient-to-r from-indigo-600 to-purple-600 border-wavelength-primary/50 text-white',
    'bg-gradient-to-r from-purple-500 to-indigo-600 border-wavelength-primary/50 text-white',
    'bg-gradient-to-r from-violet-500 to-purple-600 border-wavelength-primary/50 text-white',
    'bg-gradient-to-r from-indigo-500 to-violet-600 border-wavelength-primary/50 text-white',
    'bg-gradient-to-r from-purple-600 to-indigo-500 border-wavelength-primary/50 text-white',
    'bg-gradient-to-r from-violet-600 to-purple-500 border-wavelength-primary/50 text-white',
    'bg-gradient-to-r from-indigo-700 to-purple-700 border-wavelength-primary/50 text-white',
  ]

  const bandColors = new Map<string, string>()
  ;(bands || []).forEach((band, index) => {
    bandColors.set(band.id, colors[index % colors.length])
  })

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-display font-bold text-white mb-3">All Submitted Bands</h2>
          <p className="text-lg text-gray-400 font-normal">
            View availability calendars for all submitted bands. Click on a date to request to join a bill.
          </p>
        </div>

        {bands && bands.length > 0 && (
          <div className="mb-8 relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-2xl overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 animate-pulse-slow"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-display font-bold text-white mb-4">Band Legend</h3>
              <div className="flex flex-wrap gap-3">
                {bands.map((band) => (
                  <div
                    key={band.id}
                    className={`px-4 py-2 rounded-2xl border-2 font-semibold text-sm backdrop-blur-sm ${bandColors.get(band.id)}`}
                  >
                    {band.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <MainCalendar
          bands={bands || []}
          calendarsByBand={calendarsByBand}
          bandColors={bandColors}
          currentUserId={user.id}
          userBands={userBands || []}
        />
      </main>
    </div>
  )
}

