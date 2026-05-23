-- 1. CLEAN EXISTING DATA (Ensures a totally fresh start)
truncate public.reschedules cascade;
truncate public.passengers cascade;
truncate public.bookings cascade;
truncate public.seats cascade;
truncate public.flights cascade;

-- 2. SEED 8 FLIGHTS ACROSS 4 ROUTES
insert into public.flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price) values
-- Route 1: Delhi (DEL) to Mumbai (BOM)
('a1111111-1111-1111-1111-111111111111', 'SA-101', 'DEL', 'BOM', '2026-05-25 08:00:00+05:30', '2026-05-25 10:15:00+05:30', 'Airbus A320', 4500.00),
('a2222222-2222-2222-2222-222222222222', 'SA-102', 'DEL', 'BOM', '2026-05-26 14:30:00+05:30', '2026-05-26 16:45:00+05:30', 'Boeing 737', 4800.00),

-- Route 2: Mumbai (BOM) to Bangalore (BLR)
('b1111111-1111-1111-1111-111111111111', 'SA-201', 'BOM', 'BLR', '2026-05-25 11:00:00+05:30', '2026-05-25 12:45:00+05:30', 'Airbus A320', 3500.00),
('b2222222-2222-2222-2222-222222222222', 'SA-202', 'BOM', 'BLR', '2026-05-27 19:15:00+05:30', '2026-05-27 21:00:00+05:30', 'Airbus A321', 3900.00),

-- Route 3: Delhi (DEL) to Singapore (SIN)
('c1111111-1111-1111-1111-111111111111', 'SA-301', 'DEL', 'SIN', '2026-05-28 23:00:00+05:30', '2026-05-29 07:15:00+08:00', 'Boeing 787 Dreamliner', 18500.00),
('c2222222-2222-2222-2222-222222222222', 'SA-302', 'DEL', 'SIN', '2026-06-01 09:15:00+05:30', '2026-06-01 17:30:00+08:00', 'Airbus A350', 19200.00),

-- Route 4: Singapore (SIN) to Delhi (DEL)
('d1111111-1111-1111-1111-111111111111', 'SA-401', 'SIN', 'DEL', '2026-05-30 12:00:00+08:00', '2026-05-30 15:30:00+05:30', 'Boeing 787 Dreamliner', 17800.00),
('d2222222-2222-2222-2222-222222222222', 'SA-402', 'SIN', 'DEL', '2026-06-03 21:30:00+08:00', '2026-06-04 01:00:00+05:30', 'Airbus A350', 18100.00);


-- 3. DYNAMICALLY GENERATE FULL SEAT MAPS (24 seats per flight)
DO $$
DECLARE
    f_record RECORD;
    row_num INT;
    col_char TEXT;
    s_class TEXT;
    s_fee NUMERIC;
BEGIN
    -- Loop through all flights we just inserted
    FOR f_record IN SELECT id FROM public.flights LOOP
        
        -- Loop through 6 rows of seats
        FOR row_num IN 1..6 LOOP
            
            -- Loop through 4 seat letters (A, B, C, D) using unnest
            FOR col_char IN SELECT unnest(ARRAY['A', 'B', 'C', 'D']) LOOP
                
                -- Determine seat layout zones and pricing weights
                IF row_num = 1 THEN
                    s_class := 'first';
                    s_fee := 2500.00;
                ELSIF row_num = 2 THEN
                    s_class := 'business';
                    s_fee := 1200.00;
                ELSE
                    s_class := 'economy';
                    s_fee := 0.00;
                END IF;

                -- Insert the seat blueprint row
                INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
                VALUES (f_record.id, row_num || col_char, s_class, true, s_fee);
                
            END LOOP;
        END LOOP;
        
    END LOOP;
END $$;