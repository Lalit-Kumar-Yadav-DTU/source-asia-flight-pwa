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

## Live Preview

> Deploy this project on Vercel for a production-ready preview.

If you already have a deployment, paste the URL here.

Example: `https://source-asia-assignment.vercel.app`

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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Database migration

Use the Supabase migration flow or SQL editor to apply the SQL in `supabase/migrations/20260521_initial_schema.sql`.

### Seed data

Run the SQL in `supabase/seed.sql` to populate:
- 8 flights
- 24 seats per flight
- seat pricing by class

### Test user

Create a Supabase Auth user manually in the Supabase dashboard if needed.

Recommended test credentials for review:
- email: `tester@example.com`
- password: `Password123!`

> If you want, create the same user in Supabase Auth and sign in through the app.

---

## Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/source-asia-assignment.git
   cd source-asia-assignment
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in Supabase values in `.env.local`.
5. Run the app:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000` and start booking.

---

## Database Schema & Security

The database schema is organized around these entities:

- `flights` — flight metadata and schedule
- `seats` — per-flight seat inventory, availability, class, and extra fees
- `bookings` — confirmed tickets, linked to user, flight, and seat
- `passengers` — passenger details attached to a booking
- `reschedules` — history ledger for flight changes

### Row Level Security (RLS)

The schema enables RLS for the main tables and includes policies such as:

- `flights` and `seats` are public for read access
- `bookings` may only be read/inserted/updated by `auth.uid() = user_id`
- `passengers` and `reschedules` may only be read/inserted if the booking belongs to the current user

This keeps sensitive booking data scoped to the authenticated user.

### Seat locking and concurrency

The seed migration includes an RPC function `book_seat_atomic` that:
- locks the requested seat row with `FOR UPDATE`
- validates availability before insert
- marks the seat unavailable
- inserts the booking in the same transaction

This prevents two users from racing to book the same seat.

### Cancellation rules

The database includes a trigger function `check_cancellation_window()` that blocks cancellation if the flight departs within 2 hours.

The app calls `cancel_booking_atomic` from the dashboard, ensuring cancellation and seat release happen together.

---

## Zustand Store Design

### `src/stores/useFlightStore.ts`

This store tracks the booking flow and persists safe state using `persist`:

- `searchQuery` — current flight search criteria
- `selectedFlight` — flight selected for booking
- `selectedSeats` — seats chosen by the user
- `bookingStep` — current step in the booking wizard
- `passengersList` — passenger information for checkout

`partialize` is used to avoid storing sensitive passenger fields in local persistence.

The major actions include:
- `setSearchQuery`
- `setSelectedFlight`
- `toggleSelectedSeat`
- `setBookingStep`
- `setPassengersList`
- `resetFlightStore`

### `src/stores/useUserStore.ts`

This store persists only `sessionToken` to keep authentication state available between reloads.

It uses `partialize` to exclude raw `cachedBookings` from persisted JSON, reducing sensitive data stored in browser storage.

---

## Seat Map UX

The seat selection page renders a cabin-style grid with:
- a 6 × 4 seat layout
- class zones for first, business, and economy rows
- clear legends for available, selected, and occupied seats
- a responsive horizontal scroll wrapper for small screens
- seat limits enforced by passenger count
- real-time availability updates from Supabase Realtime

Users can only select a seat if it is still available, and the final checkout button becomes active only when the correct number of seats are chosen.

---

## Reschedule & Cancel Flow

### Cancel

- User initiates cancellation from the dashboard.
- The app calls `cancel_booking_atomic`.
- The DB transaction sets the booking status to `cancelled` and reopens the seat.
- Cancelling within 2 hours of departure is rejected by the DB trigger.

### Reschedule

- The dashboard fetches available alternative flights on the same route.
- The app writes a `reschedules` history record and updates the booking row.
- This preserves an audit trail for each reschedule.

---

## Deployment

Recommended: deploy to Vercel and configure the same Supabase env vars in project settings.

Example deploy steps:

1. Push the repository to GitHub.
2. Connect the repo to Vercel.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
4. Deploy and verify the app.

---

## Checklist

- [x] Public GitHub repository with descriptive commit history
- [x] `.env.example` with Supabase environment variables
- [x] Supabase migration SQL in `supabase/migrations`
- [x] Seed script present at `supabase/seed.sql`
- [x] README with setup steps, schema notes, and Zustand store explanation
- [ ] Lighthouse PWA screenshot (add to README after audit)
- [ ] Production deployment URL

---

## Notes

- The app uses `@supabase/ssr` and `createBrowserClient` for client-side auth and realtime flows.
- `src/app/booking/seats/page.tsx` maintains the live seat grid and syncs seat updates through a Supabase channel.
- `src/app/dashboard/page.tsx` handles cancellation and reschedule controls with clear user feedback.
- If you want to add the Lighthouse PWA screenshot, place it in `public/` and reference it here.
