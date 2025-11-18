import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET - Get a specific band
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()

    const { data: band, error } = await supabase
      .from('bands')
      .select('*')
      .eq('id', params.id)
      .eq('leader_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Band not found' }, { status: 404 })
      }
      console.error('Error fetching band:', error)
      return NextResponse.json({ error: 'Failed to fetch band' }, { status: 500 })
    }

    return NextResponse.json({ band }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/bands/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a band
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const body = await request.json()
    const { name, calendar_submitted } = body

    // Verify the band belongs to the user
    const { data: existingBand, error: fetchError } = await supabase
      .from('bands')
      .select('*')
      .eq('id', params.id)
      .eq('leader_id', user.id)
      .single()

    if (fetchError || !existingBand) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    const updateData: { name?: string; calendar_submitted?: boolean } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Band name is required' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (calendar_submitted !== undefined) {
      if (typeof calendar_submitted !== 'boolean') {
        return NextResponse.json({ error: 'Invalid calendar_submitted value' }, { status: 400 })
      }
      
      // Validate calendar before submission
      if (calendar_submitted) {
        const { data: isValid, error: validationError } = await supabase.rpc(
          'validate_calendar_submission',
          { p_band_id: params.id }
        )

        if (validationError || !isValid) {
          return NextResponse.json(
            { error: 'Calendar must have at least one available date before submission' },
            { status: 400 }
          )
        }
      }
      
      updateData.calendar_submitted = calendar_submitted
    }

    const { data: band, error } = await supabase
      .from('bands')
      .update(updateData)
      .eq('id', params.id)
      .eq('leader_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating band:', error)
      return NextResponse.json({ error: 'Failed to update band' }, { status: 500 })
    }

    return NextResponse.json({ band }, { status: 200 })
  } catch (error) {
    console.error('Error in PUT /api/bands/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a band
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()

    // Verify the band belongs to the user
    const { data: existingBand, error: fetchError } = await supabase
      .from('bands')
      .select('*')
      .eq('id', params.id)
      .eq('leader_id', user.id)
      .single()

    if (fetchError || !existingBand) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('bands')
      .delete()
      .eq('id', params.id)
      .eq('leader_id', user.id)

    if (error) {
      console.error('Error deleting band:', error)
      return NextResponse.json({ error: 'Failed to delete band' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Band deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/bands/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

