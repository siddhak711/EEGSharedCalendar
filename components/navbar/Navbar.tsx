'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import LogoutButton from '@/components/auth/LogoutButton'

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/calendar', label: 'Main Calendar' },
    { href: '/bills', label: 'Bill Requests' },
  ]

  return (
    <>
    <nav className="w-full flex justify-center px-4 sm:px-6 lg:px-8 py-4">
      <div className="w-full max-w-7xl">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between overflow-visible">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center gap-4 md:gap-6">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-gradient leading-tight">
                SoundCheck
            </h1>
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
            <Link
                    key={link.href}
                    href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                  ? 'bg-gray-800/80 text-white'
                  : 'text-white hover:text-white/90'
              }`}
            >
                    {link.label}
            </Link>
                ))}
              </div>
            </div>

            {/* Desktop Logout Button */}
            <div className="hidden md:block">
              <LogoutButton />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-white hover:bg-gray-800/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-black/95 backdrop-blur-2xl border-l border-white/10 z-50 md:hidden transform transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-display font-bold text-gradient">
              Menu
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl text-white hover:bg-gray-800/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
            <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive(link.href)
                  ? 'bg-gray-800/80 text-white'
                      : 'text-white hover:bg-gray-800/50 active:bg-gray-800/70'
              }`}
            >
                  {link.label}
            </Link>
              ))}
            </div>
          </nav>

          {/* Mobile Logout Button */}
          <div className="p-6 border-t border-white/10">
            <LogoutButton />
          </div>
        </div>
      </div>
    </>
  )
}

