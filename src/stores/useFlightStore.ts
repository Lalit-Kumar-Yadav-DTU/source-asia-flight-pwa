import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SearchQuery, Flight, Seat, PassengerData } from '@/types'

interface FlightState {
  searchQuery: SearchQuery | null
  selectedFlight: Flight | null
  selectedSeats: Seat[] // Changed to Array
  bookingStep: number
  passengersList: PassengerData[] // Changed to Array
  
  // Actions
  setSearchQuery: (query: SearchQuery) => void
  setSelectedFlight: (flight: Flight | null) => void
  toggleSelectedSeat: (seat: Seat) => void // Changed to toggle array item
  setBookingStep: (step: number) => void
  setPassengersList: (list: PassengerData[]) => void // Changed to accept Array
  resetFlightStore: () => void
}

const initialValues = {
  searchQuery: null,
  selectedFlight: null,
  selectedSeats: [],
  bookingStep: 1,
  passengersList: [],
}

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      ...initialValues,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight, selectedSeats: [] }), // Reset seats on flight switch
      setBookingStep: (step) => set({ bookingStep: step }),
      setPassengersList: (list) => set({ passengersList: list }),
      
      toggleSelectedSeat: (seat) => set((state) => {
        const isAlreadySelected = state.selectedSeats.some((s) => s.id === seat.id)
        const maxPassengers = state.searchQuery?.passengers || 1

        if (isAlreadySelected) {
          return { selectedSeats: state.selectedSeats.filter((s) => s.id !== seat.id) }
        }
        
        if (state.selectedSeats.length < maxPassengers) {
          return { selectedSeats: [...state.selectedSeats, seat] }
        }

        return state // Do nothing if trying to select more seats than passengers
      }),

      resetFlightStore: () => set(initialValues),
    }),
    {
      name: 'flight-booking-storage',
      partialize: (state) => {
        const { passengersList, ...rest } = state
        return {
          ...rest,
          passengersList: passengersList.map(p => ({ ...p, passport_no: '' })) // Strip sensitive fields from all passengers
        }
      },
    }
  )
)