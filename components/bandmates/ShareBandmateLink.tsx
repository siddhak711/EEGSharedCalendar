'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/ui/Toast'

interface ShareBandmateLinkProps {
  bandId: string
}

export default function ShareBandmateLink({ bandId }: ShareBandmateLinkProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCreatedLink(null)

    try {
      const response = await fetch('/api/bandmates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          band_id: bandId,
          name: name.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create bandmate link')
      }

      const { bandmate } = await response.json()
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/bandmate/${bandmate.token}`
      setCreatedLink(shareUrl)
      setName('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setShowToast(true)
    } catch (error) {
      console.error('Failed to copy:', error)
      setError('Failed to copy link to clipboard')
    }
  }

  return (
    <>
      {showToast && (
        <Toast
          message="Link copied to clipboard!"
          type="success"
          onClose={() => setShowToast(false)}
          duration={3000}
        />
      )}
      <div className="bg-wavelength-card rounded-2xl shadow-xl p-8">
        <h3 className="text-xl font-display font-bold text-wavelength-text mb-6">Create New Bandmate Link</h3>
        <form onSubmit={handleCreateLink} className="space-y-6">
        <div>
          <label htmlFor="bandmate-name" className="block text-sm font-medium text-wavelength-text-muted mb-3">
            Bandmate Name (optional)
          </label>
          <input
            type="text"
            id="bandmate-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-wavelength-light/50 border border-wavelength-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-wavelength-primary/50 focus:border-wavelength-primary text-wavelength-text placeholder-wavelength-text-muted font-normal transition-all"
            placeholder="Enter bandmate name (optional)"
            disabled={loading}
          />
        </div>
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}
        {createdLink && (
          <div className="p-5 bg-green-500/20 border border-green-500/50 rounded-xl">
            <p className="text-sm font-semibold text-green-200 mb-3">Link created successfully!</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={createdLink}
                className="flex-1 px-4 py-3 border border-green-500/30 rounded-lg bg-wavelength-light/50 text-sm font-mono text-wavelength-text"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(createdLink)}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-semibold transition-all duration-200"
              >
                Copy
              </button>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-electric text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200"
        >
          {loading ? 'Creating...' : 'Create Bandmate Link'}
        </button>
      </form>
    </div>
    </>
  )
}

