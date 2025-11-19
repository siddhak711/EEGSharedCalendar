import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import BillRequestList from '@/components/bills/BillRequestList'

export default async function BillsPage() {
  const user = await getAuthenticatedUser()
  const supabase = createClient()

  // Fetch all bill requests (sent and received)
  const { data: userBands, error: bandsError } = await supabase
    .from('bands')
    .select('id')
    .eq('leader_id', user.id)

  if (bandsError) {
    console.error('Error fetching user bands:', bandsError)
  }

  const userBandIds = (userBands || []).map((band) => band.id)

  let sentBills: any[] = []
  let receivedBills: any[] = []

  if (userBandIds.length > 0) {
    // Fetch sent bill requests
    const { data: sent, error: sentError } = await supabase
      .from('bill_requests')
      .select(`
        *,
        requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name),
        target_band:bands!bill_requests_target_band_id_fkey(id, name)
      `)
      .in('requesting_band_id', userBandIds)
      .order('created_at', { ascending: false })

    if (sentError) {
      console.error('Error fetching sent bills:', sentError)
    } else {
      sentBills = sent || []
    }

    // Fetch received bill requests
    const { data: received, error: receivedError } = await supabase
      .from('bill_requests')
      .select(`
        *,
        requesting_band:bands!bill_requests_requesting_band_id_fkey(id, name),
        target_band:bands!bill_requests_target_band_id_fkey(id, name)
      `)
      .in('target_band_id', userBandIds)
      .order('created_at', { ascending: false })

    if (receivedError) {
      console.error('Error fetching received bills:', receivedError)
    } else {
      receivedBills = received || []
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-wavelength-text mb-2 sm:mb-3">Bill Requests</h2>
          <p className="text-base sm:text-lg text-wavelength-text-muted font-normal">
            Manage bill requests you&apos;ve sent and received from other bands.
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8 md:space-y-10">
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-wavelength-text mb-4 sm:mb-6">Received Requests</h3>
            <BillRequestList
              bills={receivedBills}
              type="received"
              userBandIds={userBandIds}
            />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-wavelength-text mb-4 sm:mb-6">Sent Requests</h3>
            <BillRequestList
              bills={sentBills}
              type="sent"
              userBandIds={userBandIds}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

