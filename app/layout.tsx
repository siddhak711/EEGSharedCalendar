import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Band Calendar | NYC Band Scheduling',
  description: 'The coolest way for NYC bands to manage availability and collaborate on shows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

