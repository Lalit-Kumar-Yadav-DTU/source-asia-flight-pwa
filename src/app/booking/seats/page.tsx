'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/stores/useFlightStore'
import { createClient } from '@/utils/supabase/client'
import { Seat } from '@/types'
import { ArrowLeft, Armchair, Loader2, Info } from 'lucide-react'

export default function SeatsPage() {
  const router = useRouter()
  const supabase = createClient()

  // Grab multi-passenger states and actions from Zustand store [cite: 49]
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const selectedSeats = useFlightStore((state) => state.selectedSeats)
  const toggleSelectedSeat = useFlightStore((state) => state.toggleSelectedSeat)
  const searchQuery = useFlightStore((state) => state.searchQuery)

  const passengerCount = searchQuery?.passengers || 1

  // Local component states
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // 1. Set mounted state once the page enters the client layout layer
  useEffect(() => {
    setMounted(true)
    console.log("🎯 Seat Map Component Mounted Setup Successfully.")
  }, [])

  // 2. Redirect guard - executes safely ONLY after client hydration settles
  useEffect(() => {
    if (mounted) {
      console.log("📊 Diagnostic - Selected Flight State Data:", selectedFlight)
      if (!selectedFlight) {
        console.warn("⚠️ No active flight found in Zustand memory! Redirecting back to home landing page...")
        router.replace('/')
      }
    }
  }, [mounted, selectedFlight, router])

  // 3. Fetch initial seats with a strict structural guarantee wrapper 
  useEffect(() => {
    if (!mounted || !selectedFlight) return

    async function fetchSeats() {
      try {
        console.log(`📡 Requesting seat layout structures from Supabase cloud for Flight ID: ${selectedFlight.id}...`)
        
        const { data, error } = await supabase
          .from('seats')
          .select('*')
          .eq('flight_id', selectedFlight.id)
          .order('seat_number', { ascending: true })
        
        if (error) {
          console.error("❌ Supabase Database API Error:", error.message)
          return
        }

        if (data) {
          console.log(`✅ Received ${data.length} seats successfully from the cloud matrix.`)
          setSeats(data as Seat[])
        }
      } catch (catchErr) {
        console.error("❌ Critical breakdown inside async execution stream:", catchErr)
      } finally {
        // This block is guaranteed to execute even if the database connection drops
        setLoading(false)
        console.log("🔄 Loading fence cleared. UI layer released.")
      }
    }

    fetchSeats()

    // Listen to live Supabase updates on the seats table 
    const seatChannel = supabase
      .channel(`live-seats-${selectedFlight.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${selectedFlight.id}`,
        },
        (payload) => {
          const updatedSeat = payload.new as Seat
          setSeats((prevSeats) =>
            prevSeats.map((seat) => (seat.id === updatedSeat.id ? updatedSeat : seat))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(seatChannel)
    }
  }, [mounted, selectedFlight, supabase])

  // Return loading spinner placeholder if state synchronization is still executing
  if (!mounted || loading || !selectedFlight) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Generating live aircraft seating matrix...</p>
      </div>
    )
  }

  // Handle local user multi-selection toggle click
  const handleSeatClick = (seat: Seat) => {
    if (!seat.is_available) return 
    toggleSelectedSeat(seat)
  }

  const rows = [1, 2, 3, 4, 5, 6]
  const columns = ['A', 'B', 'C', 'D']

  // Multi-Passenger Calculation parameters
  const basePricePerPassenger = Number(selectedFlight.base_price)
  const totalBaseAirfare = basePricePerPassenger * passengerCount
  const totalExtraFees = selectedSeats.reduce((sum, s) => sum + Number(s.extra_fee), 0)
  const totalPrice = totalBaseAirfare + totalExtraFees

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Visual Aircraft Cabin Layout */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to details
          </button>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-1">Select Your Seats</h2>
            <p className="text-xs text-slate-400 text-center mb-8 font-medium">
              Please select exactly <b>{passengerCount} {passengerCount === 1 ? 'seat' : 'seats'}</b> for your travel group.
            </p>

            {/* SEAT LEGEND MAP CORES */}
            <div className="flex justify-center items-center gap-6 mb-8 text-xs font-semibold text-slate-500 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-100 border border-slate-200 rounded-md" /> Available
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 border border-blue-700 rounded-md" /> Selected
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-100 border border-red-200 rounded-md cursor-not-allowed" /> Occupied
              </div>
            </div>

            {/* SCROLLABLE PLANE SHELL */}
            <div className="w-full overflow-x-auto pb-4 flex justify-center touch-pan-x">
              <div className="bg-slate-50 border border-slate-200/60 rounded-t-[100px] rounded-b-3xl px-8 pt-24 pb-8 w-full max-w-[340px] flex flex-col gap-6 items-center shadow-inner relative">
                
                <div className="absolute top-8 font-bold text-[10px] uppercase text-slate-400 tracking-widest bg-slate-200/50 px-3 py-1 rounded-full">
                  Flight Front (Nose)
                </div>

                {/* ROW ITERATOR BLOCK */}
                {rows.map((rowNum) => {
                  let zoneLabel = ''
                  if (rowNum === 1) zoneLabel = 'First Class'
                  if (rowNum === 2) zoneLabel = 'Business Class'
                  if (rowNum === 3) zoneLabel = 'Economy Class'

                  return (
                    <div key={rowNum} className="w-full flex flex-col gap-2">
                      {zoneLabel && (
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-slate-200/40 pb-1 mb-1">
                          {zoneLabel}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-3">
                        {/* Left Side: Columns A and B */}
                        <div className="flex gap-2.5">
                          {columns.slice(0, 2).map((colChar) => {
                            const seatNo = `${rowNum}${colChar}`
                            const seatObj = seats.find((s) => s.seat_number === seatNo)
                            if (!seatObj) return <div key={seatNo} className="w-9 h-9" />

                            const isCurrentSelected = selectedSeats.some((s) => s.id === seatObj.id)
                            const isOccupied = !seatObj.is_available

                            let seatStyle = "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                            if (isCurrentSelected) seatStyle = "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-100"
                            if (isOccupied) seatStyle = "bg-red-50 text-red-300 border-red-100 cursor-not-allowed"

                            return (
                              <button
                                key={seatObj.id}
                                disabled={isOccupied}
                                onClick={() => handleSeatClick(seatObj)}
                                title={isOccupied ? `Occupied • ${seatObj.class.toUpperCase()}` : `${seatObj.seat_number} • Extra: ₹${Number(seatObj.extra_fee)}`}
                                className={`w-9 h-9 border text-xs font-bold rounded-xl flex items-center justify-center transition-all active:scale-90 ${seatStyle}`}
                              >
                                <Armchair className="w-4 h-4" />
                              </button>
                            )
                          })}
                        </div>

                        {/* Center Aisle Indicator Number */}
                        <div className="text-xs font-bold text-slate-300 w-4 text-center select-none">
                          {rowNum}
                        </div>

                        {/* Right Side: Columns C and D */}
                        <div className="flex gap-2.5">
                          {columns.slice(2, 4).map((colChar) => {
                            const seatNo = `${rowNum}${colChar}`
                            const seatObj = seats.find((s) => s.seat_number === seatNo)
                            if (!seatObj) return <div key={seatNo} className="w-9 h-9" />

                            const isCurrentSelected = selectedSeats.some((s) => s.id === seatObj.id)
                            const isOccupied = !seatObj.is_available

                            let seatStyle = "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                            if (isCurrentSelected) seatStyle = "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-100"
                            if (isOccupied) seatStyle = "bg-red-50 text-red-300 border-red-100 cursor-not-allowed"

                            return (
                              <button
                                key={seatObj.id}
                                disabled={isOccupied}
                                onClick={() => handleSeatClick(seatObj)}
                                title={isOccupied ? `Occupied • ${seatObj.class.toUpperCase()}` : `${seatObj.seat_number} • Extra: ₹${Number(seatObj.extra_fee)}`}
                                className={`w-9 h-9 border text-xs font-bold rounded-xl flex items-center justify-center transition-all active:scale-90 ${seatStyle}`}
                              >
                                <Armchair className="w-4 h-4" />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Checkout Price Matrix Summary panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100">Review Pricing</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Base Airfare (×{passengerCount}):</span>
                <span className="font-bold text-slate-800">₹{totalBaseAirfare.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Selected Seats:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded uppercase max-w-[150px] truncate">
                  {selectedSeats.length > 0 ? selectedSeats.map(s => s.seat_number).join(', ') : 'None'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Seat Premium Fees:</span>
                <span className="font-bold text-slate-800">₹{totalExtraFees.toLocaleString()}</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Balance:</span>
                <span className="text-xl font-extrabold text-slate-950">₹{totalPrice.toLocaleString()}</span>
              </div>

              {selectedSeats.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-600 font-medium flex gap-2 items-start mt-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Price variations and seat layout classes are dynamically mapped against your tier choices.</span>
                </div>
              )}

              <button
                disabled={selectedSeats.length !== passengerCount}
                onClick={() => router.push('/booking/confirmation')}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-sm"
              >
                {selectedSeats.length === passengerCount 
                  ? 'Proceed to Checkout' 
                  : `Select ${passengerCount - selectedSeats.length} More Seat(s)`}
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}