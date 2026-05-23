-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CREATE TABLES
create table public.flights (
    id uuid default gen_random_uuid() primary key,
    flight_no text not null unique,
    origin text not null,
    destination text not null,
    departs_at timestamptz not null,
    arrives_at timestamptz not null,
    aircraft_type text not null,
    status text not null default 'scheduled' check (status in ('scheduled', 'delayed', 'departed', 'arrived', 'cancelled')),
    base_price numeric(10, 2) not null,
    created_at timestamptz default now()
);

create table public.flights (
    id uuid default gen_random_uuid() primary key,
    flight_no text not null unique,
    origin text not null,
    destination text not null,
    departs_at timestamptz not null,
    arrives_at timestamptz not null,
    aircraft_type text not null,
    status text not null default 'scheduled' check (status in ('scheduled', 'delayed', 'departed', 'arrived', 'cancelled')),
    base_price numeric(10, 2) not null,
    created_at timestamptz default now()
);

create table public.seats (
    id uuid default gen_random_uuid() primary key,
    flight_id uuid references public.flights(id) on delete cascade not null,
    seat_number text not null,
    class text not null check (class in ('economy', 'business', 'first')),
    is_available boolean default true not null,
    extra_fee numeric(10, 2) default 0.00 not null,
    unique(flight_id, seat_number)
);

create table public.bookings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    flight_id uuid references public.flights(id) not null,
    seat_id uuid references public.seats(id) not null,
    status text not null default 'confirmed' check (status in ('confirmed', 'rescheduled', 'cancelled')),
    booked_at timestamptz default now() not null,
    total_price numeric(10, 2) not null,
    pnr_code text unique not null
    -- ❌ REMOVED: unique(flight_id, seat_id) to prevent cancellation lockout bugs
);

-- FIXED INDEX: This allows re-booking seats cleanly after a cancellation occurs!
create unique index bookings_active_flight_seat_uidx 
on public.bookings (flight_id, seat_id) 
where (status != 'cancelled');

create table public.passengers (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings(id) on delete cascade not null,
    full_name text not null,
    passport_no text not null,
    nationality text not null,
    dob date not null
);

create table public.reschedules (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings(id) on delete cascade not null,
    old_flight_id uuid references public.flights(id) not null,
    new_flight_id uuid references public.flights(id) not null,
    requested_at timestamptz default now() not null,
    fee_charged numeric(10, 2) default 0.00 not null
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.flights enable row level security;
alter table public.seats enable row level security;
alter table public.bookings enable row level security;
alter table public.passengers enable row level security;
alter table public.reschedules enable row level security;

-- 4. RLS POLICIES
create policy "Allow public read access to flights" on public.flights for select using (true);
create policy "Allow public read access to seats" on public.seats for select using (true);

create policy "Users can view their own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can insert their own bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Users can update their own bookings" on public.bookings for update using (auth.uid() = user_id);

create policy "Users can view their own passenger details" on public.passengers for select 
    using (exists (select 1 from public.bookings where bookings.id = passengers.booking_id and bookings.user_id = auth.uid()));
create policy "Users can insert their own passenger details" on public.passengers for insert 
    with check (exists (select 1 from public.bookings where bookings.id = passengers.booking_id and bookings.user_id = auth.uid()));

create policy "Users can view their own reschedules" on public.reschedules for select 
    using (exists (select 1 from public.bookings where bookings.id = reschedules.booking_id and bookings.user_id = auth.uid()));
create policy "Users can insert their own reschedules" on public.reschedules for insert 
    with check (exists (select 1 from public.bookings where bookings.id = reschedules.booking_id and bookings.user_id = auth.uid()));

-- 5. TRIGGER: ENFORCE 2-HOUR CANCELLATION TIMELINE
create or replace function check_cancellation_window() 
returns trigger as $$
declare
    flight_departure timestamptz;
begin
    if new.status = 'cancelled' and old.status != 'cancelled' then
        select departs_at into flight_departure 
        from public.flights 
        where id = new.flight_id;
        
        if flight_departure - now() < interval '2 hours' then
            raise exception 'Cancellations are blocked within 2 hours of departure.';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger enforce_cancellation_timeline
    before update on public.bookings
    for each row
    execute function check_cancellation_window();
    

-- 6. RPC: ATOMIC SEAT RESERVATION (Prevents double-booking)
create or replace function book_seat_atomic(
    p_flight_id uuid,
    p_seat_id uuid,
    p_user_id uuid,
    p_total_price numeric,
    p_pnr_code text
) returns uuid as $$
declare
    v_booking_id uuid;
    v_seat_available boolean;
begin
    select is_available into v_seat_available 
    from public.seats 
    where id = p_seat_id and flight_id = p_flight_id
    for update;

    if v_seat_available = false or v_seat_available is null then
        raise exception 'Seat is already booked by another user.';
    end if;

    update public.seats 
    set is_available = false 
    where id = p_seat_id;

    insert into public.bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
    values (p_user_id, p_flight_id, p_seat_id, 'confirmed', p_total_price, p_pnr_code)
    returning id into v_booking_id;

    return v_booking_id;
end;
$$ language plpgsql security definer;

-- 7. RPC: ATOMIC CANCELLATION
create or replace function cancel_booking_atomic(
    p_booking_id uuid,
    p_user_id uuid
) returns boolean as $$
declare
    v_seat_id uuid;
begin
    select seat_id into v_seat_id 
    from public.bookings 
    where id = p_booking_id and user_id = p_user_id
    for update;

    if v_seat_id is null then
        raise exception 'Booking not found or unauthorized.';
    end if;

    update public.bookings 
    set status = 'cancelled' 
    where id = p_booking_id;

    update public.seats 
    set is_available = true 
    where id = v_seat_id;

    return true;
end;
$$ language plpgsql security definer;

create or replace function cancel_booking_atomic(
    p_booking_id uuid,
    p_user_id uuid
) returns boolean as $$
declare
    v_seat_id uuid;
begin
    select seat_id into v_seat_id 
    from public.bookings 
    where id = p_booking_id and user_id = p_user_id
    for update;

    if v_seat_id is null then
        raise exception 'Booking not found or unauthorized.';
    END if;

    update public.bookings 
    set status = 'cancelled' 
    where id = p_booking_id;

    update public.seats 
    set is_available = true 
    where id = v_seat_id;

    return true;
end;
$$ language plpgsql security definer;

-- ====================================================================
-- 8. NEW RPC: ATOMIC RESCHEDULING ENGINE (ADD THIS TO YOUR FILE)
-- ====================================================================
create or replace function reschedule_booking_atomic(
    p_booking_id uuid,
    p_user_id uuid,
    p_new_flight_id uuid,
    p_new_seat_number text, -- Looks up matching layout seat coordinates automatically
    p_fee_charged numeric,
    p_new_total_price numeric
) returns boolean as $$
declare
    v_old_flight_id uuid;
    v_old_seat_id uuid;
    v_new_seat_id uuid;
    v_new_seat_available boolean;
begin
    -- 1. Grab target row locks on old records
    select flight_id, seat_id into v_old_flight_id, v_old_seat_id
    from public.bookings
    where id = p_booking_id and user_id = p_user_id
    for update;

    if v_old_flight_id is null then
        raise exception 'Target booking transaction record not found.';
    end if;

    -- 2. Find and lock the target seat choice on the alternate flight
    select id, is_available into v_new_seat_id, v_new_seat_available
    from public.seats
    where flight_id = p_new_flight_id and seat_number = p_new_seat_number
    for update;

    if v_new_seat_id is null or v_new_seat_available = false then
        raise exception 'Selected seat option on alternative flight is unavailable.';
    end if;

    -- 3. Release the old aircraft seat back into the availability pool
    update public.seats set is_available = true where id = v_old_seat_id;

    -- 4. Lock down the new seat selection choice
    update public.seats set is_available = false where id = v_new_seat_id;

    -- 5. Track the operation in the historical reschedules ledger
    insert into public.reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
    values (p_booking_id, v_old_flight_id, p_new_flight_id, p_fee_charged);

    -- 6. Update the central booking record parameters
    update public.bookings
    set flight_id = p_new_flight_id,
        seat_id = v_new_seat_id,
        total_price = p_new_total_price,
        status = 'rescheduled'
    where id = p_booking_id;

    return true;
end;
$$ language plpgsql security definer;
🛠️ Step 2: Connect the New RPC to Your Dashboard Front-End
Now that the database handles the intense seat-swapping transaction logic atomically, open src/app/dashboard/page.tsx in VS Code, find your old handleExecuteReschedule function, and swap it out with this single clean RPC caller:

File Path: src/app/dashboard/page.tsx (Update this function)
TypeScript
const handleExecuteReschedule = async (newFlight: Flight) => {
  if (!activeRescheduleBooking) return
  
  const confirmReschedule = window.confirm(`Confirm rescheduling to flight ${newFlight.flight_no}?`)
  if (!confirmReschedule) return

  setProcessingId(activeRescheduleBooking.id)
  setErrorMessage('')

  const oldPrice = Number(activeRescheduleBooking.total_price)
  const newBasePrice = Number(newFlight.base_price)
  const seatPremium = Number(activeRescheduleBooking.seats.extra_fee)
  const newComputedTotal = newBasePrice + seatPremium
  
  const feeCharged = newComputedTotal > oldPrice ? (newComputedTotal - oldPrice) : 0

  try {
    // Call our robust atomic rescheduling database function
    const { error } = await supabase.rpc('reschedule_booking_atomic', {
      p_booking_id: activeRescheduleBooking.id,
      p_user_id: user.id,
      p_new_flight_id: newFlight.id,
      p_new_seat_number: activeRescheduleBooking.seats.seat_number, // Auto-assigns the same seat coordinate if open!
      p_fee_charged: feeCharged,
      p_new_total_price: newComputedTotal > oldPrice ? newComputedTotal : oldPrice
    })

    if (error) throw error

    setActiveRescheduleBooking(null)
    await loadDashboardData() // Hot-reload data changes cleanly
  } catch (err: any) {
    setErrorMessage(err.message || 'Rescheduling error occurred.')
  } finally {
    setProcessingId(null)
  }
}