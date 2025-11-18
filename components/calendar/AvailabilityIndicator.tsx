interface AvailabilityIndicatorProps {
  isAvailable: boolean
}

export default function AvailabilityIndicator({ isAvailable }: AvailabilityIndicatorProps) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${
        isAvailable 
          ? 'bg-green-500' 
          : 'bg-red-500'
      }`}
      aria-label={isAvailable ? 'Available' : 'Unavailable'}
    />
  )
}

