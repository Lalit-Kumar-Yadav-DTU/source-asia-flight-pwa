'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useUserStore } from '@/stores/useUserStore' // ✅ FIXED: Added missing store import
import { Booking, Flight } from '@/types'
import { Calendar, Ticket, User, RefreshCw, XCircle, Loader2, AlertTriangle, LogOut, CheckCircle2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  // State elements
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [availableFlights, setAvailableFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Rescheduling modal tracking state
  const [activeRescheduleBooking, setActiveRescheduleBooking] = useState<any | null>(null)

  // Fetch user profile and corresponding relational bookings
  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUser(user)

    try {
      // Try fetching live cloud data first
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          flights (*),
          seats (*)
        `)
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false })

      if (error) throw error
      
      if (bookingData) {
        setBookings(bookingData)
        // Cache it securely for Task 05 Offline Reading compliance
        useUserStore.getState().setCachedBookings(bookingData)
      }
    } catch (netError) {
      console.warn("Network failed. Pulling offline-readable cached ticket backups...")
      // OFFLINE FALLBACK ENGINE: Grab the last valid array straight from Zustand memory strings
      const localCache = useUserStore.getState().cachedBookings
      setBookings(localCache || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [router])

  // Task 03: Atomic Cancellation Handler
  const handleCancelBooking = async (bookingId: string) => {
    const confirmCancel = window.confirm('Are you absolutely sure you want to cancel this flight ticket? This action is permanent.')
    if (!confirmCancel) return

    setErrorMessage('')
    setProcessingId(bookingId)

    try {
      // Invoke our database atomic cancellation RPC
      const { data, error } = await supabase.rpc('cancel_booking_atomic', {
        p_booking_id: bookingId,
        p_user_id: user.id
      })

      if (error) throw new Error(error.message)

      // Refresh data grid
      await loadDashboardData()
    } catch (err: any) {
      // Automatically catches and prints the DB-level 2-hour trigger exception text
      setErrorMessage(err.message || 'Failed to process cancellation.')
    } finally {
      setProcessingId(null)
    }
  }

  // Open the modal and pull alternative options operating along the exact same route channel
  const openRescheduleModal = async (booking: any) => {
    setErrorMessage('')
    setActiveRescheduleBooking(booking)
    
    const { data } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', booking.flights.origin)
      .eq('destination', booking.flights.destination)
      .eq('status', 'scheduled')
      .not('id', 'eq', booking.flights.id) // Exclude the current flight itself

    if (data) setAvailableFlights(data as Flight[])
  }

  // Task 03: Reschedule Processing Logic
  const handleExecuteReschedule = async (newFlight: Flight) => {
    if (!activeRescheduleBooking) return
    
    const confirmReschedule = window.confirm(`Confirm rescheduling to flight ${newFlight.flight_no}?`)
    if (!confirmReschedule) return

    setProcessingId(activeRescheduleBooking.id)
    setErrorMessage('')

    const oldPrice = Number(activeRescheduleBooking.total_price)
    const newBasePrice = Number(newFlight.base_price)
    const seatPremium = Number(activeRescheduleBooking.seats.extra_fee)
    const newComputedTotal = newBasePrice + seatPremium
    
    // Charge a delta fee if the new flight alternative is more expensive
    const feeCharged = newComputedTotal > oldPrice ? (newComputedTotal - oldPrice) : 0

    try {
      // 1. Log transaction into reschedules table historical ledger
      const { error: historyError } = await supabase
        .from('reschedules')
        .insert({
          booking_id: activeRescheduleBooking.id,
          old_flight_id: activeRescheduleBooking.flight_id,
          new_flight_id: newFlight.id,
          fee_charged: feeCharged
        })

      if (historyError) throw historyError

      // 2. Update parent booking row flight mapping pointer and balance weights
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          flight_id: newFlight.id,
          total_price: newComputedTotal > oldPrice ? newComputedTotal : oldPrice,
          status: 'rescheduled'
        })
        .eq('id', activeRescheduleBooking.id)

      if (updateError) throw updateError

      setActiveRescheduleBooking(null)
      await loadDashboardData()
    } catch (err: any) {
      setErrorMessage(err.message || 'Rescheduling error occurred.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Syncing user reservations dashboard...</p>
      </div>
    )
  }

  return (
    <main className="min-h-[85vh] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Control Header banner */}
        <div className="flex justify-between items-center mb-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Active</div>
            <div className="text-sm font-bold text-slate-700 mt-0.5">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100/70 px-4 py-2.5 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-500" /> My Bookings ({bookings.length})
        </h2>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs font-semibold text-red-600 flex items-center gap-2 mb-6 shadow-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{errorMessage}</span>
          </div>
        )}

        {/* Empty layout list status */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">You haven't reserved any flights yet.</p>
          </div>
        ) : (
          
          /* BOOKING ITEMS STREAM LIST */
          <div className="flex flex-col gap-5">
            {bookings.map((booking) => {
              const flight = booking.flights
              const seat = booking.seats
              const isCancelled = booking.status === 'cancelled'
              
              if (!flight || !seat) return null

              const departureDate = new Date(flight.departs_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div key={booking.id} className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden ${isCancelled ? 'opacity-65' : ''}`}>
                  
                  {/* Status Badge Overlays */}
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md w-fit ${
                      booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                      booking.status === 'rescheduled' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {booking.status}
                    </span>
                    <div className="text-sm font-extrabold text-slate-800 mt-1 uppercase tracking-wide">
                      PNR: <span className="font-mono text-blue-600 text-base select-all">{booking.pnr_code}</span>
                    </div>
                  </div>

                  {/* Flight Core Route layout metadata */}
                  <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 max-w-xs">
                    <div className="text-xs text-slate-400 font-medium">Route:</div>
                    <div className="text-xs font-bold text-slate-700 text-right uppercase">{flight.origin} → {flight.destination}</div>
                    <div className="text-xs text-slate-400 font-medium">Departure:</div>
                    <div className="text-xs font-semibold text-slate-700 text-right">{departureDate}</div>
                    <div className="text-xs text-slate-400 font-medium">Seat Configuration:</div>
                    <div className="text-xs font-bold text-slate-800 text-right uppercase">{seat.seat_number} ({seat.class})</div>
                    <div className="text-xs text-slate-400 font-medium">Paid Balance:</div>
                    <div className="text-xs font-extrabold text-slate-900 text-right">₹{Number(booking.total_price).toLocaleString()}</div>
                  </div>

                  {/* INTERACTIVE CONTROLS CONTAINER */}
                  <div className="flex gap-2.5 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 justify-end">
                    {!isCancelled && (
                      <>
                        <button
                          disabled={processingId === booking.id}
                          onClick={() => openRescheduleModal(booking)}
                          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 text-xs font-bold text-slate-600 px-3.5 py-2 rounded-xl transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                        </button>
                        <button
                          disabled={processingId === booking.id}
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex items-center gap-1.5 bg-red-50 border border-red-100 hover:bg-red-100/60 text-xs font-bold text-red-600 px-3.5 py-2 rounded-xl transition-all"
                        >
                          {processingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Cancel Trip
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* --- TASK 03 MODAL LAYER: ALTERNATIVE RESCHEDULING ENGINE --- */}
        {activeRescheduleBooking && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-base">Select Alternative Flight</h3>
                <button 
                  onClick={() => setActiveRescheduleBooking(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-md"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {availableFlights.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium text-center py-6">No alternative scheduled flights operating along this exact route matrix are available.</p>
                ) : (
                  availableFlights.map((flightOption) => {
                    const priceDiff = Number(flightOption.base_price) + Number(activeRescheduleBooking.seats.extra_fee) - Number(activeRescheduleBooking.total_price)
                    
                    return (
                      <div key={flightOption.id} className="border border-slate-200/80 rounded-2xl p-4 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <div>
                          <div className="text-xs font-bold text-blue-600">{flightOption.flight_no} • {flightOption.aircraft_type}</div>
                          <div className="text-xs font-semibold text-slate-600 mt-1">
                            {new Date(flightOption.departs_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Adjustment fee: {priceDiff > 0 ? `+ ₹${priceDiff.toLocaleString()}` : '₹0 (Included)'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleExecuteReschedule(flightOption)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
                        >
                          Select Option
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}