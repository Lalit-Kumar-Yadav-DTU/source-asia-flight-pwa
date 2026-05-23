'use client'

import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/stores/useFlightStore'
import { Flight } from '@/types'

export default function FlightSelectButton({ flight }: { flight: Flight }) {
  const router = useRouter()
  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight)

  const handleSelection = () => {
    // Drop item data smoothly into Zustand state sync
    setSelectedFlight(flight)
    // Advance navigation line to dynamic form entry
    router.push('/booking')
  }

  return (
    <button
      onClick={handleSelection}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.97]"
    >
      Select Flight
    </button>
  )
}