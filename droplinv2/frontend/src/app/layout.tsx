import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dropls - Game Server Panel',
  description: 'Create and manage game servers with custom subdomains',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">{children}</body>
    </html>
  )
}
