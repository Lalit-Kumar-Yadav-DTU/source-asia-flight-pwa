'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useUserStore } from '@/stores/useUserStore'
import { Plane, User, LayoutDashboard, LogOut, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const sessionToken = useUserStore((state) => state.sessionToken)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
      } else {
        setUserEmail(null)
      }
    }
    fetchUser()
  }, [sessionToken, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 text-blue-600 font-black text-lg tracking-tight">
          <Plane className="w-5 h-5 rotate-45" />
          <span>SourceAsia<span className="text-slate-800 font-medium">Airways</span></span>
        </Link>

        {/* Dynamic User Navigation Controls */}
        <div className="flex items-center gap-4">
          {userEmail ? (
            <>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passenger</span>
                <span className="text-xs font-semibold text-slate-600">{userEmail}</span>
              </div>

              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                  pathname === '/dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100/60 px-3 py-2 rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Exit
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" /> Passenger Login
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}