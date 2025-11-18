'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor =
    type === 'success'
      ? 'bg-green-500/20 border-green-500/50 text-green-200'
      : type === 'error'
      ? 'bg-red-500/20 border-red-500/50 text-red-200'
      : 'bg-blue-500/20 border-blue-500/50 text-blue-200'

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border backdrop-blur-md ${bgColor} animate-slide-in`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">{message}</p>
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100 focus:outline-none transition-opacity"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

