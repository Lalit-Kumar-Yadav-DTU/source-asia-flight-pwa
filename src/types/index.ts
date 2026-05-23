export interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: 'scheduled' | 'delayed' | 'departed' | 'arrived' | 'cancelled'
  base_price: number
}

export interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: 'economy' | 'business' | 'first'
  is_available: boolean
  extra_fee: number
}

export interface PassengerData {
  full_name: string
  passport_no: string
  nationality: string
  dob: string
}

export interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengers: number
}

export interface Booking {
  id: string
  user_id: string
  flight_id: string
  seat_id: string
  status: 'confirmed' | 'rescheduled' | 'cancelled'
  booked_at: string
  total_price: number
  pnr_code: string
  flights?: Flight // Joined from relations
  seats?: Seat     // Joined from relations
}