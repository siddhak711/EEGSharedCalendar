import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database'
import { normalizeDate } from '@/lib/utils/dateUtils'
import { Band, BandCalendar } from '@/types'

// Public endpoint to get all submitted bands and their calendars
export async function GET() {
  try {
    // Use service role client to bypass RLS for public access
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch all submitted bands (public data)
    const { data: bands, error: bandsError } = await supabase
      .from('bands')
      .select('*')
      .eq('calendar_submitted', true)
      .order('name', { ascending: true })
      .returns<Band[]>()

    if (bandsError) {
      console.error('Error fetching bands:', bandsError)
      return NextResponse.json({ error: 'Failed to fetch bands' }, { status: 500 })
    }

    // Fetch calendars for all submitted bands
    const bandIds = (bands || []).map((band) => band.id)
    const { data: calendars, error: calendarsError } = await supabase
      .from('band_calendars')
      .select('*')
      .in('band_id', bandIds.length > 0 ? bandIds : ['00000000-0000-0000-0000-000000000000'])
      .order('date', { ascending: true })
      .returns<BandCalendar[]>()

    if (calendarsError) {
      console.error('Error fetching calendars:', calendarsError)
      return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 })
    }

    // Group calendars by band
    const calendarsByBand = new Map<string, Map<string, boolean>>()
    
    ;(bands || []).forEach((band) => {
      const bandCalendar = new Map<string, boolean>()
      ;(calendars || [])
        .filter((cal) => cal.band_id === band.id)
        .forEach((cal) => {
          bandCalendar.set(normalizeDate(cal.date), cal.is_available)
        })
      calendarsByBand.set(band.id, bandCalendar)
    })

    // Convert Maps to objects for JSON serialization
    const calendarsByBandObj: Record<string, Record<string, boolean>> = {}
    calendarsByBand.forEach((calendar, bandId) => {
      const calendarObj: Record<string, boolean> = {}
      calendar.forEach((isAvailable, date) => {
        calendarObj[date] = isAvailable
      })
      calendarsByBandObj[bandId] = calendarObj
    })

    return NextResponse.json({ 
      bands: bands || [],
      calendarsByBand: calendarsByBandObj 
    }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/public/bands:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

