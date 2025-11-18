import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

// PUT - Update bill request status (accept/reject)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()
    const body = await request.json()
    const { status } = body

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "accepted" or "rejected"' },
        { status: 400 }
      )
    }

    // Verify the bill request exists and the user is the target band leader
    const { data: bill, error: billError } = await supabase
      .from('bill_requests')
      .select(`
        *,
        target_band:bands!bill_requests_target_band_id_fkey(id, name, leader_id)
      `)
      .eq('id', params.id)
      .single()

    if (billError || !bill) {
      return NextResponse.json({ error: 'Bill request not found' }, { status: 404 })
    }

    const targetBand = bill.target_band as any
    if (targetBand.leader_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this bill request' },
        { status: 403 }
      )
    }

    // Update the bill request status
    const { data: updatedBill, error: updateError } = await supabase
      .from('bill_requests')
      .update({ status })
      .eq('id', params.id)
      .select(`
        *,
        requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name),
        target_band:bands!bill_requests_target_band_id_fkey(id, name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating bill request:', updateError)
      return NextResponse.json({ error: 'Failed to update bill request' }, { status: 500 })
    }

    return NextResponse.json({ bill: updatedBill }, { status: 200 })
  } catch (error) {
    console.error('Error in PUT /api/bills/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a bill request (only by requesting band)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = createClient()

    // Verify the bill request exists and the user is the requesting band leader
    const { data: bill, error: billError } = await supabase
      .from('bill_requests')
      .select(`
        *,
        requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name, leader_id)
      `)
      .eq('id', params.id)
      .single()

    if (billError || !bill) {
      return NextResponse.json({ error: 'Bill request not found' }, { status: 404 })
    }

    const requestingBand = bill.requesting_band as any
    if (requestingBand.leader_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this bill request' },
        { status: 403 }
      )
    }

    // Delete the bill request
    const { error: deleteError } = await supabase
      .from('bill_requests')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting bill request:', deleteError)
      return NextResponse.json({ error: 'Failed to delete bill request' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Bill request deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/bills/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

