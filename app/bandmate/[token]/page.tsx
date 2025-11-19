import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BandmateCalendar from '@/components/bandmates/BandmateCalendar'
import { normalizeDate } from '@/lib/utils/dateUtils'

export default async function BandmatePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createClient()

  // Fetch bandmate info using database function
  const { data: bandmateData, error: bandmateError } = await supabase.rpc('get_bandmate_by_token', {
    p_token: params.token,
  })

  if (bandmateError || !bandmateData || bandmateData.length === 0) {
    notFound()
  }

  const bandmateRow = bandmateData[0]
  const bandmate = {
    id: bandmateRow.id,
    band_id: bandmateRow.band_id,
    name: bandmateRow.name,
    token: bandmateRow.token,
    created_at: bandmateRow.created_at,
    bands: {
      id: bandmateRow.band_id,
      name: bandmateRow.band_name,
    },
  }

  // Fetch band calendar to show availability using database function
  const { data: bandCalendar, error: calendarError } = await supabase.rpc('get_band_calendar_by_bandmate_token', {
    p_token: params.token,
  })

  if (calendarError) {
    console.error('Error fetching band calendar:', calendarError)
  }

  // Fetch bandmate availability using database function
  const { data: bandmateAvailability, error: availabilityError } = await supabase.rpc('get_bandmate_availability_by_token', {
    p_token: params.token,
  })

  if (availabilityError) {
    console.error('Error fetching bandmate availability:', availabilityError)
  }

  const bandCalendarMap = new Map<string, boolean>(
    (bandCalendar || []).map((item: { date: string | Date; is_available: boolean }) => [
      normalizeDate(item.date),
      item.is_available,
    ])
  )

  const bandmateAvailabilityMap = new Map<string, boolean>(
    (bandmateAvailability || []).map((item: { date: string | Date; is_unavailable: boolean }) => [
      normalizeDate(item.date),
      item.is_unavailable,
    ])
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-display font-bold text-gradient mb-4">
            {(bandmate.bands as any).name}
          </h1>
          <p className="text-xl text-wavelength-text font-semibold mb-2">
            {bandmate.name ? `${bandmate.name}'s ` : ''}Availability
          </p>
          <p className="text-base text-wavelength-text-muted mt-2 font-normal">
            Mark dates when you're unavailable.
          </p>
        </div>

        <div className="bg-wavelength-card rounded-2xl shadow-xl p-8">
          <BandmateCalendar
            token={params.token}
            bandId={(bandmate.bands as any).id}
            bandCalendar={bandCalendarMap}
            initialUnavailability={bandmateAvailabilityMap}
            bandName={(bandmate.bands as any).name}
          />
        </div>
      </div>
    </div>
  )
}

