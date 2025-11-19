import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Band Calendar
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Band Not Found</h1>
          <p className="text-gray-600 mb-8">
            The band you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}

