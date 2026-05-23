# Source Asia Airways

A responsive flight booking PWA built with Next.js 16, Supabase, Tailwind CSS, and Zustand.

This project is designed to demonstrate a safe booking flow with:
- schema-driven seat locking and atomic operations
- Supabase Row Level Security (RLS)
- realtime seat availability sync
- responsive seat map UX for mobile, tablet and desktop
- cancellation / reschedule workflow with DB-level business rules
- persisted state and secure store design using Zustand

---

## 🚀 Live Preview

**Production Deployment:** [https://source-asia-flight-pwa.vercel.app/](https://source-asia-flight-pwa.vercel.app/)

---

## ✈️ Quick Start Testing Guide

To experience the full end-to-end interactive capabilities of the app without encountering mock data gaps, use the following evaluation parameters:

1. **Active Departure Routes:** Select **DEL** (Delhi), **BOM** (Mumbai), or **BLR** (Bangalore).
2. **Target Flight Dates:** Choose any date between **May 25, 2026, and May 28, 2026** (e.g., searching DEL ⇄ BOM on May 25 will populate live relational data rows instantly).
3. **Recommended Test Credentials:**
   - **Email:** `tester@example.com`
   - **Password:** `Password123!`

---

## 📊 Lighthouse Audit Metrics

The production application has been compiled using the custom Webpack lifecycle configuration pipeline to optimize service worker registration, script distribution, and asset delivery. 

- **Performance:** 98%
- **Best Practices:** 100%
- **Accessibility:** 84%
- **SEO:** 80%

*Note: For full visibility, an audit screenshot capturing these performance metrics has been saved under the project documentation assets.*

---

## Key Features

- **Realtime seat map**: live updates from Supabase Realtime channels on `seats`.
- **Atomic seat booking**: seat reservation logic uses a database lock to prevent double-booking.
- **2-hour cancellation rule**: enforced at the database layer using a trigger.
- **RLS-protected booking data**: users can only read/insert/update their own booking and passenger records.
- **Responsive design**: UI adapts across mobile, tablet and desktop.
- **Zustand store with partial persistence**: stores only safe data and strips sensitive fields before saving.
- **Clean TypeScript code**: strongly typed state, no `any` used in core stores.

---

## Tech Stack

- Next.js 16
- React 19
- Supabase (Auth, Realtime, Postgres, RLS)
- Zustand
- Tailwind CSS v4
- next-pwa
- TypeScript

---

## Repository Structure

- `src/app/` – Next.js App Router pages and flows
- `src/stores/` – Zustand stores for flight booking and user session state
- `src/utils/supabase/` – Supabase client helpers for browser and server contexts
- `supabase/migrations/` – SQL schema with tables, RLS policies, triggers, and atomic RPCs
- `supabase/seed.sql` – sample flight and seat data loader

---

## Supabase Setup

### Required environment variables

Create a `.env.local` file from `.env.example` and provide your Supabase project values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

Database migration
Use the Supabase migration flow or SQL editor to apply the SQL in supabase/migrations/20260521_initial_schema.sql.

Seed data
Run the SQL in supabase/seed.sql to populate:

8 flights

24 seats per flight

seat pricing by class

Local Installation
Clone the repository:

Bash
git clone [https://github.com/Lalit-Kumar-Yadav-DTU/source-asia-flight-pwa.git](https://github.com/Lalit-Kumar-Yadav-DTU/source-asia-flight-pwa.git)
cd source-asia-flight-pwa
Install dependencies:

Bash
npm install
Create .env.local:

Bash
cp .env.example .env.local
Fill in Supabase values in .env.local.

Run the app using the Webpack-compiler fallback script:

Bash
npm run dev
Open http://localhost:3000 and start booking.

Database Schema & Security
The database schema is organized around these entities:

flights — flight metadata and schedule

seats — per-flight seat inventory, availability, class, and extra fees

bookings — confirmed tickets, linked to user, flight, and seat

passengers — passenger details attached to a booking

reschedules — history ledger for flight changes

Row Level Security (RLS)
The schema enables RLS for the main tables and includes policies such as:

flights and seats are public for read access

bookings may only be read/inserted/updated by auth.uid() = user_id

passengers and reschedules may only be read/inserted if the booking belongs to the current user

This keeps sensitive booking data scoped to the authenticated user.

Seat locking and concurrency
The seed migration includes an RPC function book_seat_atomic that:

locks the requested seat row with FOR UPDATE

validates availability before insert

marks the seat unavailable

inserts the booking in the same transaction

This prevents two users from racing to book the same seat.

Cancellation rules
The database includes a trigger function check_cancellation_window() that blocks cancellation if the flight departs within 2 hours.

The app calls cancel_booking_atomic from the dashboard, ensuring cancellation and seat release happen together.

Zustand Store Design
src/stores/useFlightStore.ts
This store tracks the booking flow and persists safe state using persist:

searchQuery — current flight search criteria

selectedFlight — flight selected for booking

selectedSeats — seats chosen by the user

bookingStep — current step in the booking wizard

passengersList — passenger information for checkout

partialize is used to avoid storing sensitive passenger fields in local persistence.

The major actions include:

setSearchQuery

setSelectedFlight

toggleSelectedSeat

setBookingStep

setPassengersList

resetFlightStore

src/stores/useUserStore.ts
This store persists only sessionToken to keep authentication state available between reloads.

It uses partialize to exclude raw cachedBookings from persisted JSON, reducing sensitive data stored in browser storage.

Seat Map UX
The seat selection page renders a cabin-style grid with:

a 6 × 4 seat layout

class zones for first, business, and economy rows

clear legends for available, selected, and occupied seats

a responsive horizontal scroll wrapper for small screens

seat limits enforced by passenger count

real-time availability updates from Supabase Realtime

Users can only select a seat if it is still available, and the final checkout button becomes active only when the correct number of seats are chosen.

Reschedule & Cancel Flow
Cancel
User initiates cancellation from the dashboard.

The app calls cancel_booking_atomic.

The DB transaction sets the booking status to cancelled and reopens the seat.

Cancelling within 2 hours of departure is rejected by the DB trigger.

Reschedule
The dashboard fetches available alternative flights on the same route.

The app writes a reschedules history record and updates the booking row.

This preserves an audit trail for each reschedule.