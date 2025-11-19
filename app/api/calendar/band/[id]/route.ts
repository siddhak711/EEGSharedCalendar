import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeDate } from '@/lib/utils/dateUtils'

// GET - Get band calendar with bandmate availability factored in
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()

    // Verify the band belongs to the user
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('*')
      .eq('id', params.id)
      .eq('leader_id', user.id)
      .single()

    if (bandError || !band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    // Fetch the band's calendar with bandmate availability factored in
    const { data: finalAvailability, error: availabilityError } = await supabase.rpc(
      'get_band_availability_with_bandmates',
      { p_band_id: params.id }
    )

    if (availabilityError) {
      console.error('Error fetching final availability:', availabilityError)
      // Provide more detailed error message for debugging
      const errorMessage = availabilityError.message || 'Failed to fetch calendar data from database'
      return NextResponse.json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? availabilityError : undefined
      }, { status: 500 })
    }

    // Convert to Record format for JSON, normalizing dates to YYYY-MM-DD
    const availability: Record<string, boolean> = {}
    if (finalAvailability && Array.isArray(finalAvailability)) {
      finalAvailability.forEach((avail: { date: string | Date; is_available: boolean }) => {
      availability[normalizeDate(avail.date)] = avail.is_available
    })
    }

    return NextResponse.json({
      availability,
      band,
    })
  } catch (error) {
    console.error('Error in GET /api/calendar/band/[id]:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

