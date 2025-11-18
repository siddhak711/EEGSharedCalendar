import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Update bandmate availability (no auth required, uses token)
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { token, date, is_unavailable } = body

    if (!token || !date || typeof is_unavailable !== 'boolean') {
      return NextResponse.json(
        { error: 'token, date, and is_unavailable are required' },
        { status: 400 }
      )
    }

    // Use database function to update availability (bypasses RLS)
    const { data, error } = await supabase.rpc('update_bandmate_availability_by_token', {
      p_token: token,
      p_date: date,
      p_is_unavailable: is_unavailable,
    })

    if (error) {
      console.error('Error updating bandmate availability:', error)
      if (error.message === 'Invalid token') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }

    return NextResponse.json({ id: data }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/bandmate-availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get bandmate availability (no auth required, uses token)
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    // Use database function to get availability (bypasses RLS)
    const { data: availability, error } = await supabase.rpc('get_bandmate_availability_by_token', {
      p_token: token,
    })

    if (error) {
      console.error('Error fetching bandmate availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    if (!availability || availability.length === 0) {
      return NextResponse.json({ availability: [] }, { status: 200 })
    }

    return NextResponse.json({ availability }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/bandmate-availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

