'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function PassengerAuthPage() {
  const router = useRouter()
  const supabase = createClient()

  // Tab State Toggle: true = Login, false = Create Account (SignUp)
  const [isLoginTab, setIsLoginTab] = useState(true)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsProcessing(true)

    if (isLoginTab) {
      // Execute standard Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        setIsProcessing(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      // Execute Passenger Registration (SignUp)
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Bypasses email verification links so accounts work instantly locally
          emailRedirectTo: window.location.origin,
        }
      })

      if (error) {
        setErrorMessage(error.message)
        setIsProcessing(false)
      } else {
        setSuccessMessage('Passenger account created successfully! You can now toggle to login.')
        setIsProcessing(false)
        setIsLoginTab(true) // Flip them automatically to login view
      }
    }
  }

  return (
    <main className="min-h-[85vh] bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-6 md:p-8">
        
        <div className="flex items-center gap-2 text-blue-600 mb-2 justify-center">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">Passenger Portal</h2>
        </div>
        <p className="text-xs text-slate-400 font-medium text-center mb-6">
          Log in or create an account to manage flight reservations and real-time seating maps.
        </p>

        {/* Auth Toggle Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 mb-6 text-xs font-bold text-slate-500">
          <button
            onClick={() => { setIsLoginTab(true); setErrorMessage(''); }}
            className={`py-2.5 rounded-lg transition-all ${isLoginTab ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setErrorMessage(''); }}
            className={`py-2.5 rounded-lg transition-all ${!isLoginTab ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'}`}
          >
            Register Account
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-semibold text-red-600 flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs font-semibold text-emerald-600 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuthAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="traveler@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100"
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoginTab ? 'Sign In' : 'Register New Account'}
          </button>
        </form>

      </div>
    </main>
  )
}