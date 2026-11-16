-- Usage: docker exec -i catalog-postgres psql -U postgres -d catalog_db < scripts/generate-booking-slots.sql
-- Re-run after every catalog-service restart: data.sql (sql.init.mode=always) empties booking_slots.
-- Generates AVAILABLE booking_slots for the next 14 days from each service's ACTIVE
-- available_rules (catalog_db). Rule times are instants on 1970-01-01 whose
-- wall-clock time at a fixed UTC+7 is the shift (01:00Z = 08:00). Not Asia/Ho_Chi_Minh:
-- in 1970 that zone was UTC+8, which would shift every slot by one hour.
-- day_of_weeek: 2 = Monday ... 8 = Sunday (= ISO dow + 1).
-- Idempotent: an existing slot at the same service + start is skipped.
WITH days AS (
  SELECT d::date AS day
  FROM generate_series((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
                       (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 13, interval '1 day') AS d
),
shifts AS (
  SELECT r.service_id, d.day, r.slot_duration_minute AS dur,
         ((r.start_time AT TIME ZONE 'UTC') + interval '7 hours')::time AS t_start,
         ((r.end_time AT TIME ZONE 'UTC') + interval '7 hours')::time AS t_end
  FROM available_rules r
  JOIN services s ON s.service_id = r.service_id AND s.is_deleted = 0 AND s.status = 'PUBLISHED'
                 AND s.execution_type = 'ONSITE'
  JOIN days d ON EXTRACT(ISODOW FROM d.day)::int + 1 = r.day_of_weeek
  WHERE r.is_deleted = 0 AND r.status = 'ACTIVE' AND r.slot_duration_minute > 0
),
slots AS (
  SELECT sh.service_id,
         ((sh.day + sh.t_start) + make_interval(mins => sh.dur * k)) AT TIME ZONE 'Asia/Ho_Chi_Minh' AS start_at,
         ((sh.day + sh.t_start) + make_interval(mins => sh.dur * (k + 1))) AT TIME ZONE 'Asia/Ho_Chi_Minh' AS end_at
  FROM shifts sh
  CROSS JOIN LATERAL generate_series(0, (EXTRACT(EPOCH FROM (sh.t_end - sh.t_start)) / 60 / sh.dur)::int - 1) AS k
)
INSERT INTO booking_slots (booking_slot_id, service_id, start_at, end_at, status, created_at)
SELECT gen_random_uuid(), sl.service_id, sl.start_at, sl.end_at, 'AVAILABLE', now()
FROM slots sl
WHERE sl.start_at > now()
  AND NOT EXISTS (
    SELECT 1 FROM booking_slots b WHERE b.service_id = sl.service_id AND b.start_at = sl.start_at
  );

-- The catalog API lists slots by created_at DESC: give sooner slots a later
-- created_at so they come first.
UPDATE booking_slots SET created_at = now() - (start_at - now()) / 1000
WHERE status = 'AVAILABLE' AND order_id IS NULL AND start_at > now();
