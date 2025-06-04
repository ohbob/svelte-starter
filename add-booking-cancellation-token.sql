-- Add cancellation token to bookings table for secure client cancellation
ALTER TABLE bookings 
ADD COLUMN cancellation_token TEXT UNIQUE;

-- Generate cancellation tokens for existing bookings that don't have them
UPDATE bookings 
SET cancellation_token = gen_random_uuid()::text
WHERE cancellation_token IS NULL 
AND status IN ('confirmed', 'pending');

-- Create index for faster lookups
CREATE INDEX idx_bookings_cancellation_token ON bookings(cancellation_token);

-- Verify the changes
SELECT 
    COUNT(*) as total_bookings,
    COUNT(cancellation_token) as bookings_with_token,
    COUNT(*) - COUNT(cancellation_token) as bookings_without_token
FROM bookings; 