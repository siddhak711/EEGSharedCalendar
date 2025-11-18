import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { generateShareToken } from '@/lib/utils/tokenUtils'

// GET - Get all bands for the authenticated user
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()

    const { data: bands, error } = await supabase
      .from('bands')
      .select('*')
      .eq('leader_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bands:', error)
      return NextResponse.json({ error: 'Failed to fetch bands' }, { status: 500 })
    }

    return NextResponse.json({ bands }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/bands:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new band
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Band name is required' }, { status: 400 })
    }

    const shareToken = generateShareToken()

    const { data: band, error } = await supabase
      .from('bands')
      .insert({
        name: name.trim(),
        leader_id: user.id,
        share_token: shareToken,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating band:', error)
      return NextResponse.json({ error: 'Failed to create band' }, { status: 500 })
    }

    // Generate default availability for all days over 6 months
    const { error: calendarError } = await supabase.rpc('generate_default_availability', {
      p_band_id: band.id,
    })

    if (calendarError) {
      console.error('Error generating default availability:', calendarError)
      // Continue even if this fails - availability can be set manually
    }

    return NextResponse.json({ band }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bands:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

