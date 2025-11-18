import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

// POST - Update calendar availability
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const body = await request.json()
    const { band_id, date, is_available } = body

    if (!band_id || !date || typeof is_available !== 'boolean') {
      return NextResponse.json(
        { error: 'band_id, date, and is_available are required' },
        { status: 400 }
      )
    }

    // Verify the band belongs to the user
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('*')
      .eq('id', band_id)
      .eq('leader_id', user.id)
      .single()

    if (bandError || !band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    // Check if calendar is submitted and allow updates anyway (as per requirements)
    // But we still allow updates even after submission

    // Upsert the calendar entry
    const { data: calendar, error: calendarError } = await supabase
      .from('band_calendars')
      .upsert({
        band_id,
        date,
        is_available,
      }, {
        onConflict: 'band_id,date',
      })
      .select()
      .single()

    if (calendarError) {
      console.error('Error updating calendar:', calendarError)
      return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 })
    }

    return NextResponse.json({ calendar }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get calendar for a specific band
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const band_id = searchParams.get('band_id')

    if (!band_id) {
      return NextResponse.json({ error: 'band_id is required' }, { status: 400 })
    }

    // Verify the band belongs to the user or is submitted and visible
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('*')
      .eq('id', band_id)
      .or(`leader_id.eq.${user.id},calendar_submitted.eq.true`)
      .single()

    if (bandError || !band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    // Fetch calendar
    const { data: calendar, error: calendarError } = await supabase
      .from('band_calendars')
      .select('*')
      .eq('band_id', band_id)
      .order('date', { ascending: true })

    if (calendarError) {
      console.error('Error fetching calendar:', calendarError)
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 })
    }

    return NextResponse.json({ calendar }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

