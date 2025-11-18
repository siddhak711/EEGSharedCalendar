import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BandList from '@/components/bands/BandList'
import CreateBandForm from '@/components/bands/CreateBandForm'
import Navbar from '@/components/navbar/Navbar'

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  const supabase = createClient()

  const { data: bands, error } = await supabase
    .from('bands')
    .select('*')
    .eq('leader_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bands:', error)
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h2 className="text-4xl font-display font-bold text-white mb-3">Your Bands</h2>
          <p className="text-lg text-gray-400 font-normal">Manage your bands and their availability calendars</p>
        </div>

        <div className="mb-10">
          <CreateBandForm />
        </div>

        <BandList bands={bands || []} />
      </main>
    </div>
  )
}

