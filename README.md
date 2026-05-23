# ✈️ Source Asia Airways

> A responsive flight booking Progressive Web App built with Next.js 16, Supabase, Tailwind CSS, and Zustand.

**Built by [Lalit Kumar Yadav](https://www.linkedin.com/in/lalit-kumar-yadav-75a804297/), DTU 2026**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://source-asia-flight-pwa.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Lalit-Kumar-Yadav-DTU/source-asia-flight-pwa)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Lalit%20Kumar%20Yadav-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/lalit-kumar-yadav-75a804297/)

---

## 📋 Table of Contents

- [Live Preview](#-live-preview)
- [Quick Start Testing Guide](#-quick-start-testing-guide)
- [Lighthouse Audit](#-lighthouse-audit)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Supabase Setup](#-supabase-setup)
- [Local Installation](#-local-installation)
- [Database Schema & Security](#-database-schema--security)
- [Zustand Store Design](#-zustand-store-design)
- [Seat Map UX](#-seat-map-ux)
- [Reschedule & Cancel Flow](#-reschedule--cancel-flow)

---

## 🚀 Live Preview

| Resource | Link |
|---|---|
| 🌐 Production App | [source-asia-flight-pwa.vercel.app](https://source-asia-flight-pwa.vercel.app/) |
| 💻 GitHub Repository | [Lalit-Kumar-Yadav-DTU/source-asia-flight-pwa](https://github.com/Lalit-Kumar-Yadav-DTU/source-asia-flight-pwa) |

---

## ✈️ Quick Start Testing Guide

To experience the full end-to-end interactive capabilities without encountering mock data gaps, use the following evaluation parameters:

**1. Active Departure Routes**
Select **DEL** (Delhi), **BOM** (Mumbai), or **BLR** (Bangalore).

**2. Target Flight Dates**
Choose any date between **May 25 – May 28, 2026**.
_(e.g., searching DEL ⇄ BOM on May 25 will populate live relational data rows instantly)_

**3. Recommended Test Credentials**

```
Email:    test123@gmail.com
Password: test123
```

---

## 📊 Lighthouse Audit

The production application was compiled using a custom Webpack lifecycle configuration pipeline to optimize service worker registration, script distribution, and asset delivery.

| Metric | Score |
|---|---|
| ⚡ Performance | 98% |
| ✅ Best Practices | 100% |
| ♿ Accessibility | 84% |
| 🔍 SEO | 80% |

### Lighthouse Score Screenshot

<img width="1600" height="809" alt="image" src="https://github.com/user-attachments/assets/c702bcdd-1bdd-4b7c-8c61-05a9f97e320e" />

---

## ✨ Key Features

- **Realtime Seat Map** — live availability updates via Supabase Realtime channels on `seats`
- **Atomic Seat Booking** — reservation logic uses a database-level row lock to prevent double-booking
- **2-Hour Cancellation Rule** — enforced at the database layer using a trigger
- **RLS-Protected Booking Data** — users can only read/insert/update their own bookings and passenger records
- **Responsive Design** — UI adapts seamlessly across mobile, tablet, and desktop
- **Zustand Store with Partial Persistence** — stores only safe data; strips sensitive fields before saving to `localStorage`
- **Clean TypeScript** — strongly typed state throughout; no `any` used in core stores

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Backend / Auth | Supabase (Auth, Realtime, Postgres, RLS) |
| State Management | Zustand |
| PWA | next-pwa |
| Language | TypeScript |

---

## 📁 Repository Structure

```
source-asia-flight-pwa/
├── src/
│   ├── app/            # Next.js App Router pages and booking flows
│   ├── stores/         # Zustand stores for flight booking and user session
│   └── utils/
│       └── supabase/   # Supabase client helpers (browser + server)
├── supabase/
│   ├── migrations/     # SQL schema — tables, RLS policies, triggers, atomic RPCs
│   └── seed.sql        # Sample flight and seat data loader
```

---

## 🔧 Supabase Setup

### Environment Variables

Create a `.env.local` file from the provided example and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Migration

Apply the schema using the Supabase SQL editor or migration CLI:

```bash
supabase/migrations/20260521_initial_schema.sql
```

### Seed Data

Run `supabase/seed.sql` to populate:

- 8 flights
- 24 seats per flight
- Seat pricing by class

---

## 💻 Local Installation

**1. Clone the repository**

```bash
git clone https://github.com/Lalit-Kumar-Yadav-DTU/source-asia-flight-pwa.git
cd source-asia-flight-pwa
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env.local
# Fill in your Supabase values in .env.local
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the app**

Visit [http://localhost:3000](http://localhost:3000) and start booking.

---

## 🗄️ Database Schema & Security

The schema is organized around five core entities:

| Table | Description |
|---|---|
| `flights` | Flight metadata and schedule |
| `seats` | Per-flight seat inventory, availability, class, and fees |
| `bookings` | Confirmed tickets linked to user, flight, and seat |
| `passengers` | Passenger details attached to a booking |
| `reschedules` | History ledger for flight changes |

### Row Level Security (RLS)

RLS is enabled on all main tables with the following policies:

- `flights` and `seats` are publicly readable
- `bookings` can only be read/inserted/updated where `auth.uid() = user_id`
- `passengers` and `reschedules` are accessible only if the associated booking belongs to the current user

This keeps all sensitive booking data scoped strictly to the authenticated user.

### Seat Locking & Concurrency

The migration includes an RPC function `book_seat_atomic` that:

1. Locks the requested seat row with `FOR UPDATE`
2. Validates availability before inserting
3. Marks the seat as unavailable
4. Inserts the booking — all within a single transaction

This prevents two users from racing to book the same seat simultaneously.

### Cancellation Rules

A trigger function `check_cancellation_window()` blocks cancellation if the flight departs within **2 hours**. The app calls `cancel_booking_atomic` from the dashboard, ensuring cancellation and seat release happen atomically.

---

## 🧠 Zustand Store Design

### `src/stores/useFlightStore.ts`

Tracks the booking flow and persists safe state using `persist`:

| State Field | Purpose |
|---|---|
| `searchQuery` | Current flight search criteria |
| `selectedFlight` | Flight selected for booking |
| `selectedSeats` | Seats chosen by the user |
| `bookingStep` | Current step in the booking wizard |
| `passengersList` | Passenger information for checkout |

`partialize` is used to prevent sensitive passenger fields from being written to `localStorage`.

**Key actions:** `setSearchQuery`, `setSelectedFlight`, `toggleSelectedSeat`, `setBookingStep`, `setPassengersList`, `resetFlightStore`

### `src/stores/useUserStore.ts`

Persists only `sessionToken` to maintain authentication state between reloads. `partialize` excludes raw `cachedBookings` from persisted JSON, minimising sensitive data in browser storage.

---

## 🪑 Seat Map UX

The seat selection page renders a full cabin-style grid with:

- A **6 × 4 seat layout**
- Distinct class zones for **First**, **Business**, and **Economy**
- Clear visual legends for available, selected, and occupied seats
- A responsive horizontal scroll wrapper for small screens
- Seat limits enforced by passenger count
- Real-time availability updates from Supabase Realtime

Users can only select an available seat, and the checkout button activates only when the correct number of seats is chosen.

---

## 🔄 Reschedule & Cancel Flow

### Cancel

1. User initiates cancellation from the dashboard
2. App calls `cancel_booking_atomic`
3. The DB transaction sets booking status to `cancelled` and reopens the seat
4. Cancellations within 2 hours of departure are rejected by the DB trigger

### Reschedule

1. Dashboard fetches available alternative flights on the same route
2. App writes a `reschedules` history record and updates the booking row
3. An audit trail is preserved for every reschedule event

---

<div align="center">

Built with ❤️ by **[Lalit Kumar Yadav](https://www.linkedin.com/in/lalit-kumar-yadav-75a804297/)**, DTU 2026

</div>
