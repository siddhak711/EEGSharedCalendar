'use client'

import { useState } from 'react'
import { formatDateForDisplay } from '@/lib/utils/dateUtils'
import { useRouter } from 'next/navigation'

interface BillRequest {
  id: string
  requesting_band_id: string
  target_band_id: string
  date: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  requesting_band: { id: string; name: string }
  target_band: { id: string; name: string }
}

interface BillRequestListProps {
  bills: BillRequest[]
  type: 'sent' | 'received'
  userBandIds: string[]
}

export default function BillRequestList({
  bills,
  type,
  userBandIds,
}: BillRequestListProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  const handleStatusUpdate = async (billId: string, status: 'accepted' | 'rejected') => {
    setUpdating(new Set(updating).add(billId))

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update bill request')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating bill request:', error)
      alert(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      const newUpdating = new Set(updating)
      newUpdating.delete(billId)
      setUpdating(newUpdating)
    }
  }

  const handleDelete = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill request?')) {
      return
    }

    setUpdating(new Set(updating).add(billId))

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete bill request')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting bill request:', error)
      alert(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      const newUpdating = new Set(updating)
      newUpdating.delete(billId)
      setUpdating(newUpdating)
    }
  }

  if (bills.length === 0) {
    return (
      <div className="bg-wavelength-card rounded-2xl shadow-xl p-12 text-center">
        <p className="text-lg text-wavelength-text-muted font-normal">
          {type === 'received'
            ? 'No received bill requests'
            : 'No sent bill requests'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-wavelength-card rounded-2xl shadow-xl overflow-hidden">
      <ul className="divide-y divide-wavelength-primary/10">
        {bills.map((bill) => {
          const isUpdating = updating.has(bill.id)
          const isReceived = type === 'received'
          const otherBand = isReceived ? bill.requesting_band : bill.target_band

          return (
            <li key={bill.id} className="p-6 hover:bg-wavelength-light/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h4 className="text-lg font-display font-bold text-wavelength-text">
                      {isReceived
                        ? `${bill.requesting_band.name} wants to join ${bill.target_band.name}`
                        : `${bill.requesting_band.name} wants to join ${bill.target_band.name}`}
                    </h4>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        bill.status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : bill.status === 'accepted'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-base text-wavelength-text font-medium mb-1">
                    Date: {formatDateForDisplay(bill.date)}
                  </p>
                  <p className="text-sm text-wavelength-text-muted mt-1">
                    {isReceived
                      ? `Requested by ${bill.requesting_band.name}`
                      : `Requested to ${bill.target_band.name}`}
                    {' • '}
                    {new Date(bill.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isReceived && bill.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(bill.id, 'accepted')}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all duration-200"
                      >
                        {isUpdating ? 'Updating...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(bill.id, 'rejected')}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all duration-200"
                      >
                        {isUpdating ? 'Updating...' : 'Reject'}
                      </button>
                    </>
                  )}
                  {!isReceived && bill.status === 'pending' && (
                    <button
                      onClick={() => handleDelete(bill.id)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all duration-200"
                    >
                      {isUpdating ? 'Deleting...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

