import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeDate } from '@/lib/utils/dateUtils'

// GET - Get main calendar data (all submitted bands with availability)
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()

    // Fetch all submitted bands
    const { data: bands, error: bandsError } = await supabase
      .from('bands')
      .select('*')
      .eq('calendar_submitted', true)
      .order('name', { ascending: true })

    if (bandsError) {
      console.error('Error fetching bands:', bandsError)
      return NextResponse.json({ error: 'Failed to fetch bands' }, { status: 500 })
    }

    // Fetch calendars for all submitted bands (for fallback)
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
    const calendarsByBand: Record<string, Record<string, boolean>> = {}
    
    // Use database function to get final availability (band calendar + bandmate unavailability)
    for (const band of bands || []) {
      const { data: finalAvailability, error: availabilityError } = await supabase.rpc(
        'get_band_availability_with_bandmates',
        { p_band_id: band.id }
      )

      if (availabilityError) {
        console.error(`Error fetching final availability for band ${band.id}:`, availabilityError)
        // Fallback to regular calendar if function fails
        const bandCalendar: Record<string, boolean> = {}
        ;(calendars || [])
          .filter((cal) => cal.band_id === band.id)
          .forEach((cal) => {
            bandCalendar[normalizeDate(cal.date)] = cal.is_available
          })
        calendarsByBand[band.id] = bandCalendar
      } else {
        const bandCalendar: Record<string, boolean> = {}
        ;(finalAvailability || []).forEach((avail: { date: string | Date; is_available: boolean }) => {
          bandCalendar[normalizeDate(avail.date)] = avail.is_available
        })
        calendarsByBand[band.id] = bandCalendar
      }
    }

    // Get user's bands
    const { data: userBands, error: userBandsError } = await supabase
      .from('bands')
      .select('*')
      .eq('leader_id', user.id)
      .eq('calendar_submitted', true)

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

    const bandColors: Record<string, string> = {}
    ;(bands || []).forEach((band, index) => {
      bandColors[band.id] = colors[index % colors.length]
    })

    return NextResponse.json({
      bands: bands || [],
      calendarsByBand,
      bandColors,
      currentUserId: user.id,
      userBands: userBands || [],
    })
  } catch (error) {
    console.error('Error in GET /api/calendar/main:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

