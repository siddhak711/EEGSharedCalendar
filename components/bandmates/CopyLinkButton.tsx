'use client'

import { useState } from 'react'

interface CopyLinkButtonProps {
  shareUrl: string
}

export default function CopyLinkButton({ shareUrl }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        readOnly
        value={shareUrl}
        className="flex-1 px-4 py-3 border border-wavelength-primary/20 rounded-lg bg-wavelength-light/50 text-sm font-mono text-wavelength-text"
      />
      <button
        onClick={handleCopy}
        className="px-6 py-3 bg-gradient-electric text-white rounded-lg hover:opacity-90 text-sm font-semibold disabled:opacity-50 transition-all duration-200"
        disabled={copied}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

