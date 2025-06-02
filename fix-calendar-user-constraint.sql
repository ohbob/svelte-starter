-- Fix calendar integrations foreign key constraint
-- Remove orphaned calendar integrations that reference non-existent users

-- First, check what orphaned records exist
SELECT 'Orphaned calendar integrations:' as info;
SELECT user_id FROM calendar_integrations WHERE user_id NOT IN (SELECT id FROM "user");

-- Delete orphaned calendar integrations
DELETE FROM calendar_integrations WHERE user_id NOT IN (SELECT id FROM "user");

-- Show remaining records
SELECT 'Remaining calendar integrations:' as info;
SELECT COUNT(*) as count FROM calendar_integrations; 