export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Invalid Link</h1>
        <p className="text-gray-600 mb-4">
          The bandmate link you're trying to access is invalid or has expired.
        </p>
        <p className="text-sm text-gray-500">
          Please contact your band leader for a new link.
        </p>
      </div>
    </div>
  )
}

