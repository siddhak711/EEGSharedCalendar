'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="w-full flex justify-center px-4 sm:px-6 lg:px-8 py-4">
      <div className="w-full max-w-7xl">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 px-6 py-3.5 flex items-center justify-between overflow-visible">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-display font-bold text-gradient leading-tight">
              WaveLength
            </h1>
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'bg-gray-800/80 text-white'
                  : 'text-white hover:text-white/90'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/calendar"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/calendar')
                  ? 'bg-gray-800/80 text-white'
                  : 'text-white hover:text-white/90'
              }`}
            >
              Main Calendar
            </Link>
            <Link
              href="/bills"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/bills')
                  ? 'bg-gray-800/80 text-white'
                  : 'text-white hover:text-white/90'
              }`}
            >
              Bill Requests
            </Link>
          </div>
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}

