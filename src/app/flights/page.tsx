
import { createClient } from '@/utils/supabase/server'
import { Flight } from '@/types'
import { Plane, Calendar, MapPin, Clock } from 'lucide-react'
import FlightSelectButton from './FlightSelectButton'

interface SearchParams {
  origin?: string
  destination?: string
  date?: string
}

export default async function FlightsResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  const origin = resolvedParams.origin?.toUpperCase()
  const destination = resolvedParams.destination?.toUpperCase()
  const date = resolvedParams.date

  // Query Supabase directly on the server secure side
  let query = supabase.from('flights').select('*')

  if (origin) query = query.eq('origin', origin)
  if (destination) query = query.eq('destination', destination)
  
  if (date) {
    query = query
      .gte('departs_at', `${date}T00:00:00+00:00`)
      .lte('departs_at', `${date}T23:59:59+00:00`)
  }

  const { data: flights, error } = await query

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Top summary path header */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700 text-lg uppercase">{origin || 'ANY'}</span>
            <Plane className="w-4 h-4 text-slate-400 rotate-45" />
            <span className="font-bold text-slate-700 text-lg uppercase">{destination || 'ANY'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Calendar className="w-4 h-4 text-blue-500" />
            {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'All Dates'}
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6">Available Flights ({flights?.length || 0})</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm font-medium">
            Error retrieving flight combinations. Please try again later.
          </div>
        )}

        {!flights || flights.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm max-w-2xl mx-auto">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium text-lg">No flights found matching your route criteria.</p>
            
            {/* Elegant Fallback Guard for Date Limitations */}
            <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left max-w-md mx-auto">
              <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                ⚠️ Seed Schedule Interval Constraint
              </p>
              <p className="leading-relaxed">
                Database matrices are operational for schedules between <span className="font-bold">May 25, 2026</span> and <span className="font-bold">May 28, 2026</span> (e.g., matching pairs like <strong>DEL ⇄ BOM</strong> or <strong>BOM ⇄ BLR</strong> populated inside this window will invoke dynamic seat selections).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {flights.map((flight: Flight) => {
              const depTime = new Date(flight.departs_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const arrTime = new Date(flight.arrives_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              
              const flightDate = new Date(flight.departs_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })
              
              return (
                <div key={flight.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Flight number info */}
                  <div>
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md inline-block mb-2">
                      {flight.flight_no}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">{flight.aircraft_type}</div>
                  </div>

                  {/* Route Timeline Core */}
                  <div className="flex items-center gap-6 md:gap-12 flex-1 max-w-md justify-center">
                    
                    {/* Departure timing block */}
                    <div className="text-center md:text-left">
                      <div className="text-xs font-bold text-blue-500 mb-0.5">{flightDate}</div>
                      <div className="text-xl font-bold text-slate-800">{depTime}</div>
                      <div className="text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-1 justify-center md:justify-start">
                        <MapPin className="w-3 h-3 text-slate-400" /> {flight.origin}
                      </div>
                    </div>

                    {/* Progress visual divider */}
                    <div className="flex-1 flex flex-col items-center relative px-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Direct</div>
                      <div className="w-full h-[2px] bg-slate-200 rounded relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white pl-1 text-slate-300">
                          <Plane className="w-3.5 h-3.5 rotate-45" />
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 2h 15m
                      </div>
                    </div>

                    {/* Arrival timing block */}
                    <div className="text-center md:text-right">
                      <div className="text-xs font-bold text-slate-400 mb-0.5 opacity-0 hidden md:block">Date</div>
                      <div className="text-xl font-bold text-slate-800">{arrTime}</div>
                      <div className="text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-1 justify-center md:justify-end">
                        <MapPin className="w-3 h-3 text-slate-400" /> {flight.destination}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Interactive block */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left md:text-right">Base Price</div>
                      <div className="text-2xl font-extrabold text-slate-800">₹{Number(flight.base_price).toLocaleString()}</div>
                    </div>
                    <FlightSelectButton flight={flight} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

