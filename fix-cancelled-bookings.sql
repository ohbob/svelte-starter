-- Fix cancelled bookings that still show "In Calendar"
-- This script clears the googleEventId for cancelled bookings

-- First, let's see how many cancelled bookings have googleEventId
SELECT 
    COUNT(*) as cancelled_with_events,
    'cancelled bookings with googleEventId' as description
FROM bookings 
WHERE status = 'cancelled' 
AND google_event_id IS NOT NULL;

-- Show the specific bookings that will be updated
SELECT 
    id,
    guest_name,
    guest_email,
    start_time,
    google_event_id,
    status,
    cancellation_reason
FROM bookings 
WHERE status = 'cancelled' 
AND google_event_id IS NOT NULL
ORDER BY updated_at DESC;

-- Clear googleEventId for cancelled bookings
UPDATE bookings 
SET google_event_id = NULL,
    updated_at = NOW()
WHERE status = 'cancelled' 
AND google_event_id IS NOT NULL;

-- Verify the fix
SELECT 
    COUNT(*) as remaining_cancelled_with_events,
    'cancelled bookings still with googleEventId (should be 0)' as description
FROM bookings 
WHERE status = 'cancelled' 
AND google_event_id IS NOT NULL; 