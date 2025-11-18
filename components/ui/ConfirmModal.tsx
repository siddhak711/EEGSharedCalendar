'use client'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 via-transparent to-[#00A8FF]/5 animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00A8FF]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-display font-bold text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? 'Loading...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

