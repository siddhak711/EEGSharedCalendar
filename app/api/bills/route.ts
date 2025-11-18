import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET - Get all bill requests for the authenticated user's bands
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'sent' or 'received'

    // Get user's bands
    const { data: userBands, error: bandsError } = await supabase
      .from('bands')
      .select('id')
      .eq('leader_id', user.id)

    if (bandsError) {
      console.error('Error fetching user bands:', bandsError)
      return NextResponse.json({ error: 'Failed to fetch bands' }, { status: 500 })
    }

    const userBandIds = (userBands || []).map((band) => band.id)

    if (userBandIds.length === 0) {
      return NextResponse.json({ bills: [] }, { status: 200 })
    }

    let query = supabase
      .from('bill_requests')
      .select(`
        *,
        requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name),
        target_band:bands!bill_requests_target_band_id_fkey(id, name)
      `)

    if (type === 'sent') {
      query = query.in('requesting_band_id', userBandIds)
    } else if (type === 'received') {
      query = query.in('target_band_id', userBandIds)
    } else {
      // Get both sent and received - fetch separately and combine
      const { data: sent, error: sentError } = await supabase
        .from('bill_requests')
        .select(`
          *,
          requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name),
          target_band:bands!bill_requests_target_band_id_fkey(id, name)
        `)
        .in('requesting_band_id', userBandIds)
        .order('created_at', { ascending: false })

      const { data: received, error: receivedError } = await supabase
        .from('bill_requests')
        .select(`
          *,
          requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name),
          target_band:bands!bill_requests_target_band_id_fkey(id, name)
        `)
        .in('target_band_id', userBandIds)
        .order('created_at', { ascending: false })

      if (sentError || receivedError) {
        console.error('Error fetching bills:', sentError || receivedError)
        return NextResponse.json({ error: 'Failed to fetch bill requests' }, { status: 500 })
      }

      // Combine and remove duplicates
      const allBills = [...(sent || []), ...(received || [])]
      const uniqueBills = allBills.filter((bill, index, self) =>
        index === self.findIndex((b) => b.id === bill.id)
      )

      return NextResponse.json({ bills: uniqueBills }, { status: 200 })
    }

    const { data: bills, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bill requests:', error)
      return NextResponse.json({ error: 'Failed to fetch bill requests' }, { status: 500 })
    }

    return NextResponse.json({ bills }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new bill request
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const body = await request.json()
    const { requesting_band_id, target_band_id, date } = body

    if (!requesting_band_id || !target_band_id || !date) {
      return NextResponse.json(
        { error: 'requesting_band_id, target_band_id, and date are required' },
        { status: 400 }
      )
    }

    // Verify the requesting band belongs to the user
    const { data: requestingBand, error: requestingBandError } = await supabase
      .from('bands')
      .select('*')
      .eq('id', requesting_band_id)
      .eq('leader_id', user.id)
      .single()

    if (requestingBandError || !requestingBand) {
      return NextResponse.json({ error: 'Requesting band not found' }, { status: 404 })
    }

    // Verify the requesting band has submitted its calendar
    if (!requestingBand.calendar_submitted) {
      return NextResponse.json(
        { error: 'You must submit your calendar before requesting to join a bill' },
        { status: 400 }
      )
    }

    // Verify the target band exists and has submitted its calendar
    const { data: targetBand, error: targetBandError } = await supabase
      .from('bands')
      .select('*')
      .eq('id', target_band_id)
      .eq('calendar_submitted', true)
      .single()

    if (targetBandError || !targetBand) {
      return NextResponse.json({ error: 'Target band not found or not submitted' }, { status: 404 })
    }

    // Verify the target band is available on that date
    const { data: targetCalendar, error: calendarError } = await supabase
      .from('band_calendars')
      .select('*')
      .eq('band_id', target_band_id)
      .eq('date', date)
      .eq('is_available', true)
      .single()

    if (calendarError || !targetCalendar) {
      return NextResponse.json(
        { error: 'Target band is not available on that date' },
        { status: 400 }
      )
    }

    // Check if a request already exists
    const { data: existingRequest, error: existingError } = await supabase
      .from('bill_requests')
      .select('*')
      .eq('requesting_band_id', requesting_band_id)
      .eq('target_band_id', target_band_id)
      .eq('date', date)
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A bill request already exists for this date' },
        { status: 400 }
      )
    }

    // Create the bill request
    const { data: bill, error: billError } = await supabase
      .from('bill_requests')
      .insert({
        requesting_band_id,
        target_band_id,
        date,
        status: 'pending',
      })
      .select(`
        *,
        requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name),
        target_band:bands!bill_requests_target_band_id_fkey(id, name)
      `)
      .single()

    if (billError) {
      console.error('Error creating bill request:', billError)
      return NextResponse.json({ error: 'Failed to create bill request' }, { status: 500 })
    }

    return NextResponse.json({ bill }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

