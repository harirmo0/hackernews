import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tech & Security AI Analyzer',
  description: 'AI-powered analysis and insights from HackerNews stories and HackTheBox RSS feeds',
  keywords: ['HackerNews', 'HackTheBox', 'AI', 'Analysis', 'Tech News', 'Cybersecurity', 'Stories', 'RSS'],
  authors: [{ name: 'Tech & Security AI Analyzer' }],
  openGraph: {
    title: 'Tech & Security AI Analyzer',
    description: 'AI-powered analysis and insights from HackerNews stories and HackTheBox RSS feeds',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech & Security AI Analyzer',
    description: 'AI-powered analysis and insights from HackerNews stories and HackTheBox RSS feeds',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ff6600',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
          {children}
        </div>
      </body>
    </html>
  )
}
