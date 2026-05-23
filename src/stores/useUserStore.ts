import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Booking } from '@/types'

interface UserState {
  sessionToken: string | null
  cachedBookings: Booking[]
  
  // Actions
  setSessionToken: (token: string | null) => void
  setCachedBookings: (bookings: Booking[]) => void
  clearUserStore: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      sessionToken: null,
      cachedBookings: [],

      setSessionToken: (token) => set({ sessionToken: token }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      clearUserStore: () => set({ sessionToken: null, cachedBookings: [] }),
    }),
    {
      name: 'user-auth-storage',
      // Task 04 Requirement: Persist only the session token, drop raw booking caches from storage strings
      partialize: (state) => ({ sessionToken: state.sessionToken }),
    }
  )
)