import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Get bandmate info by token (no auth required)
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient()

    // Use database function to get bandmate (bypasses RLS)
    const { data: bandmateData, error: bandmateError } = await supabase.rpc('get_bandmate_by_token', {
      p_token: params.token,
    })

    if (bandmateError || !bandmateData || bandmateData.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const bandmateDataRow = bandmateData[0]

    // Format the response to match the expected structure
    const bandmate = {
      id: bandmateDataRow.id,
      band_id: bandmateDataRow.band_id,
      name: bandmateDataRow.name,
      token: bandmateDataRow.token,
      created_at: bandmateDataRow.created_at,
      bands: {
        id: bandmateDataRow.band_id,
        name: bandmateDataRow.band_name,
        calendar_submitted: bandmateDataRow.band_calendar_submitted,
      },
    }

    return NextResponse.json({ bandmate }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/bandmates/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

