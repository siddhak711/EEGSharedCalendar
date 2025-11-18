import { getAuthenticatedUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import ShareBandmateLink from '@/components/bandmates/ShareBandmateLink'
import CopyLinkButton from '@/components/bandmates/CopyLinkButton'

export default async function ShareBandPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getAuthenticatedUser()
  const supabase = createClient()

  // Fetch the band
  const { data: band, error: bandError } = await supabase
    .from('bands')
    .select('*')
    .eq('id', params.id)
    .eq('leader_id', user.id)
    .single()

  if (bandError || !band) {
    notFound()
  }

  // Fetch existing bandmates
  const { data: bandmates, error: bandmatesError } = await supabase
    .from('bandmates')
    .select('*')
    .eq('band_id', params.id)
    .order('created_at', { ascending: false })

  if (bandmatesError) {
    console.error('Error fetching bandmates:', bandmatesError)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-display font-bold text-wavelength-text mb-3">{band.name}</h2>
          <p className="text-lg text-wavelength-text-muted font-normal">
            Share a link with your bandmates so they can mark when they're unavailable.
            Each bandmate will get their own unique link.
          </p>
        </div>

        <div className="mb-8">
          <ShareBandmateLink bandId={params.id} />
        </div>

        <div className="bg-wavelength-card rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-display font-bold text-wavelength-text mb-6">Existing Bandmate Links</h3>
          {bandmates && bandmates.length > 0 ? (
            <div className="space-y-4">
              {bandmates.map((bandmate) => {
                const shareUrl = `${baseUrl}/bandmate/${bandmate.token}`
                return (
                  <div key={bandmate.id} className="border border-wavelength-primary/20 rounded-xl p-5 bg-wavelength-light/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-base text-wavelength-text font-semibold mb-3">
                          {bandmate.name || 'Unnamed bandmate'}
                        </p>
                        <CopyLinkButton shareUrl={shareUrl} />
                        <p className="text-xs text-wavelength-text-muted mt-3">
                          Created: {new Date(bandmate.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xl text-wavelength-text-muted font-normal">No bandmate links created yet. Create one above!</p>
          )}
        </div>
      </main>
    </div>
  )
}

