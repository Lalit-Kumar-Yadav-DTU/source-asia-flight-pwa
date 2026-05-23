'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/stores/useFlightStore'
import { PlaneTakeoff, PlaneLanding, Calendar, Users, Plane } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()
  const setSearchQuery = useFlightStore((state) => state.setSearchQuery)

  // Local form state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(1)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination || !date) return

    // Update global Zustand State
    // Find this block inside handleSearch:
    setSearchQuery({
      origin: origin.toUpperCase().trim(),
      destination: destination.toUpperCase().trim(),
      date,
      passengers,
    })

    // UPDATE THIS LINE to append query params:
    router.push(`/flights?origin=${origin.toUpperCase().trim()}&destination=${destination.toUpperCase().trim()}&date=${date}`)
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      {/* Branding Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-200">
          <Plane className="w-6 h-6 rotate-45" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Source Asia Airways</h1>
      </div>

      {/* Main Search Panel Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-100 p-6 md:p-8 border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Book your next flight</h2>
        
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Origin Airport Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <PlaneTakeoff className="w-3.5 h-3.5 text-blue-500" /> From
            </label>
            <input
              type="text"
              placeholder="e.g. DEL"
              maxLength={3}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 uppercase placeholder:normal-case focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Destination Airport Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <PlaneLanding className="w-3.5 h-3.5 text-blue-500" /> To
            </label>
            <input
              type="text"
              placeholder="e.g. BOM"
              maxLength={3}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 uppercase placeholder:normal-case focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Departure Date Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Passenger Count Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Travelers
            </label>
            <select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Search Trigger Button */}
          <div className="md:col-span-4 mt-4 flex justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
            >
              Search Flights
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}