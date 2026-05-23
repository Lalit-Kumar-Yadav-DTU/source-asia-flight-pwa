'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/stores/useFlightStore'
import { User, CreditCard, Globe, Calendar, ArrowLeft, Plane, AlertCircle } from 'lucide-react'

export default function BookingPage() {
  const router = useRouter()
  
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const searchQuery = useFlightStore((state) => state.searchQuery)
  const setPassengersList = useFlightStore((state) => state.setPassengersList)

  const passengerCount = searchQuery?.passengers || 1

  // Initialize array of local forms matching traveler count
  const [passengers, setPassengers] = useState<any[]>(
    Array.from({ length: passengerCount }, () => ({
      full_name: '',
      passport_no: '',
      nationality: '',
      dob: '',
    }))
  )
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedFlight) router.push('/')
  }, [selectedFlight, router])

  if (!selectedFlight) return null

  const handleInputChange = (index: number, field: string, value: string) => {
    const updated = [...passengers]
    updated[index][field] = value
    setPassengers(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Product Thinking: Age Verification Guard (Current year: 2026)
    const today = new Date('2026-05-21') // Strict anchor sync for consistency

    for (let i = 0; i < passengers.length; i++) {
      const dobDate = new Date(passengers[i].dob)
      const ageInMs = today.getTime() - dobDate.getTime()
      const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25)

      if (ageInYears < 2) {
        setError(`Passenger #${i + 1} is registered under 2 years old. Infants must travel on an adult lap. Separate seat bookings are blocked.`)
        return
      }
    }

    // Save array to Zustand state link
    setPassengersList(passengers)
    router.push('/booking/seats')
  }

  const basePrice = Number(selectedFlight.base_price)
  const totalBaseFare = basePrice * passengerCount

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to flight results
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {passengers.map((passenger, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h2 className="text-sm font-black text-blue-600 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  Passenger #{index + 1} Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1"><User className="w-3.5 h-3.5" /> Full Name</label>
                    <input
                      type="text"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      value={passenger.full_name}
                      onChange={(e) => handleInputChange(index, 'full_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Passport Number</label>
                    <input
                      type="text"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 uppercase focus:outline-none focus:border-blue-500"
                      value={passenger.passport_no}
                      onChange={(e) => handleInputChange(index, 'passport_no', e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Nationality</label>
                    <input
                      type="text"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      value={passenger.nationality}
                      onChange={(e) => handleInputChange(index, 'nationality', e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date of Birth</label>
                    <input
                      type="date"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      value={passenger.dob}
                      onChange={(e) => handleInputChange(index, 'dob', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-sm self-end px-8">
              Continue to Seat Selection
            </button>
          </form>
        </div>

        {/* Right Checkout Panel - Multiplied prices */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-500 rotate-45" /> Trip Summary
            </h3>
            <div className="flex flex-col gap-3 text-xs font-medium text-slate-500">
              <div className="flex justify-between"><span>Base Airfare (×{passengerCount}):</span> <span className="font-bold text-slate-800">₹{totalBaseFare.toLocaleString()}</span></div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Price:</span>
                <span className="text-xl font-extrabold text-slate-900">₹{totalBaseFare.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}