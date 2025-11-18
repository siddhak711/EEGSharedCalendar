'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateBandForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create band')
      }

      const { band } = await response.json()
      setName('')
      router.refresh()
      // Optionally redirect to the band's calendar page
      router.push(`/band/${band.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/20 shadow-2xl overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 animate-pulse-slow"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00A8FF]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-display font-bold text-white mb-6">Create New Band</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="band-name" className="block text-sm font-medium text-white mb-3">
              Band Name
            </label>
            <input
              type="text"
              id="band-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-gray-400 font-normal transition-all"
              placeholder="Enter band name"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40"
          >
            {loading ? 'Creating...' : 'Create Band'}
          </button>
        </form>
      </div>
    </div>
  )
}

