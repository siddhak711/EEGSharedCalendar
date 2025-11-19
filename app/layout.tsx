import type { Metadata } from 'next'
import './globals.css'
import { PostHogProvider } from '../components/PostHogProvider'

export const metadata: Metadata = {
  title: 'Band Calendar | NYC Band Scheduling',
  description: 'The coolest way for NYC bands to manage availability and collaborate on shows',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}