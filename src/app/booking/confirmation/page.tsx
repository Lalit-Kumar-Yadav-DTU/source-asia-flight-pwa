'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/stores/useFlightStore'
import { createClient } from '@/utils/supabase/client'
import { ShieldCheck, Loader2, AlertCircle, CheckCircle, Ticket, User, Landmark } from 'lucide-react'

export default function ConfirmationPage() {
  const router = useRouter()
  const supabase = createClient()

  // Grab array-based multi-passenger states from Zustand store
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const selectedSeats = useFlightStore((state) => state.selectedSeats)
  const passengersList = useFlightStore((state) => state.passengersList)
  const resetFlightStore = useFlightStore((state) => state.resetFlightStore)

  // Local state machines
  const [userSession, setUserSession] = useState<any>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmedPnr, setConfirmedPnr] = useState('')

  // Check if a user session exists already
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserSession(user)
    }
    checkAuth()
  }, [supabase])

  // Redirect guard - Bypass instantly if a confirmation PNR already exists!
  useEffect(() => {
    if (confirmedPnr) return // Fix: Prevents the race-condition redirect loop

    if (!selectedFlight || selectedSeats.length === 0 || passengersList.length === 0) {
      router.push('/')
    }
  }, [selectedFlight, selectedSeats, passengersList, router, confirmedPnr])

  if (!selectedFlight || selectedSeats.length === 0 || passengersList.length === 0) return null

  // Quick helper to sign in test users inside the checkout context
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsProcessing(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(), 
      password: authPassword,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsProcessing(false)
    } else {
      setUserSession(data.user)
      setIsProcessing(false)
    }
  }

  // The primary database insertion transaction logic matching array data loops
  const handleFinalizeBooking = async () => {
    if (!userSession) return
    setErrorMessage('')
    setIsProcessing(true)

    try {
      const pnrList: string[] = []

      // Loop through each selected seat/passenger combination
      for (let i = 0; i < passengersList.length; i++) {
        const currentPassenger = passengersList[i]
        const currentSeat = selectedSeats[i]
        const generatedPnr = Math.random().toString(36).substring(2, 8).toUpperCase()
        const totalIndividualPrice = Number(selectedFlight!.base_price) + Number(currentSeat.extra_fee)

        // 1. Invoke seat reservation RPC transaction
        const { data: bookingId, error: rpcError } = await supabase.rpc('book_seat_atomic', {
          p_flight_id: selectedFlight!.id,
          p_seat_id: currentSeat.id,
          p_user_id: userSession.id,
          p_total_price: totalIndividualPrice,
          p_pnr_code: generatedPnr
        })

        if (rpcError) throw new Error(`Seat ${currentSeat.seat_number} booking collision: ${rpcError.message}`)

        // 2. Insert corresponding passenger identity details
        const { error: passengerError } = await supabase
          .from('passengers')
          .insert({
            booking_id: bookingId,
            full_name: currentPassenger.full_name,
            passport_no: currentPassenger.passport_no,
            nationality: currentPassenger.nationality,
            dob: currentPassenger.dob
          })

        if (passengerError) throw passengerError
        pnrList.push(generatedPnr)
      }

      // Success: Set local state first to freeze the layout values on-screen cleanly
      setConfirmedPnr(pnrList.join(', '))
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected transaction error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Group calculations for visualization
  const totalPassengers = passengersList.length
  const totalBaseFare = Number(selectedFlight.base_price) * totalPassengers
  const totalExtraFees = selectedSeats.reduce((sum, s) => sum + Number(s.extra_fee), 0)
  const grandTotal = totalBaseFare + totalExtraFees

  // --- RENDER VIEW 1: SUCCESSFUL BOOKING SUMMARY ---
  if (confirmedPnr) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Booking Confirmed!</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Your ticket reservation sequence completed successfully.</p>

          <div className="w-full bg-slate-50 rounded-2xl border border-slate-200/60 p-5 my-6 flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1 text-xs font-semibold text-slate-400">
              <span className="uppercase text-[10px] tracking-wider">RESERVATION PNR(s)</span>
              <span className="text-sm font-mono font-black text-blue-600 tracking-wider bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 block text-center break-words mt-1">
                {confirmedPnr}
              </span>
            </div>
            <div className="h-[1px] bg-slate-200/60 border-dashed border-t my-1" />
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Flight:</span> <span className="font-bold text-slate-700">{selectedFlight.flight_no}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Route:</span> <span className="font-bold text-slate-700 uppercase">{selectedFlight.origin} → {selectedFlight.destination}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Assigned Seats:</span> <span className="font-bold text-slate-700 uppercase">{selectedSeats.map(s => s.seat_number).join(', ')}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Travelers Group:</span> <span className="font-bold text-slate-700 max-w-[200px] truncate text-right">{passengersList.map(p => p.full_name).join(', ')}</span>
            </div>
          </div>

          {/* Fix: Flush Zustand data cache ONLY when clicking this action link to leave */}
          <button
            onClick={() => {
              resetFlightStore()
              router.push('/dashboard')
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            Go to My Bookings
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-6 md:p-8">
        
        {/* --- RENDER VIEW 2: AUTHENTICATION BARRIER GATE --- */}
        {!userSession ? (
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-bold text-slate-800 text-lg">Secure Auth Verification</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-6">Supabase RLS is active. Please log in with your test user credentials to save this booking safely to your profile.</p>

            {errorMessage && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-semibold text-red-600 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Email</label>
                <input
                  type="email"
                  placeholder="test@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />} Sign In & Verify
              </button>
            </form>
          </div>
        ) : (
          
          /* --- RENDER VIEW 3: FINAL TRANSACTION SUMMARY RELEASE --- */
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-500" /> Finalize Checkout
            </h2>
            <p className="text-xs text-slate-400 font-medium mb-6">Review your flight group details one last time before sealing the ticket reservation.</p>

            {errorMessage && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-semibold text-red-600 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col gap-3.5 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-xs font-medium text-slate-600">
              <div className="flex justify-between items-center">
                <span>Group Size:</span> 
                <span className="font-bold text-slate-800">{totalPassengers} {totalPassengers === 1 ? 'Traveler' : 'Travelers'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>✈ Flight Code:</span> 
                <span className="font-bold text-slate-800">{selectedFlight.flight_no}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>💺 Seats Chosen:</span> 
                <span className="font-bold text-slate-800 uppercase">{selectedSeats.map(s => s.seat_number).join(', ')}</span>
              </div>
              <div className="h-[1px] bg-slate-200/50 my-0.5" />
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-slate-400" /> Total Group Cost:</span> 
                <span className="font-extrabold text-slate-950 text-base">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleFinalizeBooking}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />} Authorize & Ticket Group
            </button>
          </div>
        )}
      </div>
    </main>
  )
}