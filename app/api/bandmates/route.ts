import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { generateBandmateToken } from '@/lib/utils/tokenUtils'

// POST - Create a new bandmate token
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const body = await request.json()
    const { band_id, name } = body

    if (!band_id) {
      return NextResponse.json({ error: 'band_id is required' }, { status: 400 })
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

    // Generate a unique token
    const token = generateBandmateToken()

    // Create bandmate entry
    const { data: bandmate, error: bandmateError } = await supabase
      .from('bandmates')
      .insert({
        band_id,
        token,
        name: name || null,
      })
      .select()
      .single()

    if (bandmateError) {
      console.error('Error creating bandmate:', bandmateError)
      return NextResponse.json({ error: 'Failed to create bandmate token' }, { status: 500 })
    }

    return NextResponse.json({ bandmate }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bandmates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get all bandmates for a band
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const band_id = searchParams.get('band_id')

    if (!band_id) {
      return NextResponse.json({ error: 'band_id is required' }, { status: 400 })
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

    // Fetch bandmates
    const { data: bandmates, error: bandmatesError } = await supabase
      .from('bandmates')
      .select('*')
      .eq('band_id', band_id)
      .order('created_at', { ascending: false })

    if (bandmatesError) {
      console.error('Error fetching bandmates:', bandmatesError)
      return NextResponse.json({ error: 'Failed to fetch bandmates' }, { status: 500 })
    }

    return NextResponse.json({ bandmates }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/bandmates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

