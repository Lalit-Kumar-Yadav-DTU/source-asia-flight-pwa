'use client'

import Navbar from '@/components/Navbar'
import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUserStore } from '@/stores/useUserStore'
import { Inter } from 'next/font/google'
import "./globals.css"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const setSessionToken = useUserStore((state) => state.setSessionToken)
  const setCachedBookings = useUserStore((state) => state.setCachedBookings)

  useEffect(() => {
    // 1. Fetch current session immediately on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionToken(session?.access_token || null)
    })

    // 2. Setup live listener to catch logouts/logins globally across tabs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSessionToken(session?.access_token || null)
      
      if (session?.user) {
        // Cache bookings locally for Task 05 Offline Reading compliance
        const { data } = await supabase
          .from('bookings')
          .select('*, flights(*), seats(*)')
          .eq('user_id', session.user.id)
        if (data) setCachedBookings(data)
      } else {
        setCachedBookings([])
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, setSessionToken, setCachedBookings])

  return (
  <html lang="en">
    <head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#2563eb" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
    </head>
    <body className={inter.className}>
      <Navbar /> {/* RENDER NAVBAR HERE */}
      {children}
    </body>
  </html>
)
}