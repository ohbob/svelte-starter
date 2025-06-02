-- Migration: Change calendar integrations from company-based to user-based
-- This allows users to share their calendar integration across all their companies

-- Step 1: Add the new userId column
ALTER TABLE calendar_integrations ADD COLUMN user_id TEXT;

-- Step 2: Populate user_id based on company ownership
UPDATE calendar_integrations 
SET user_id = (
    SELECT c.user_id 
    FROM companies c 
    WHERE c.id = calendar_integrations.company_id
);

-- Step 3: Make user_id NOT NULL (after populating)
ALTER TABLE calendar_integrations ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraint to users table
ALTER TABLE calendar_integrations 
ADD CONSTRAINT calendar_integrations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Step 5: Remove the old company_id column and its constraint
ALTER TABLE calendar_integrations DROP CONSTRAINT calendar_integrations_company_id_companies_id_fk;
ALTER TABLE calendar_integrations DROP COLUMN company_id;

-- Step 6: Ensure only one active integration per user
-- Deactivate duplicate integrations, keeping the most recent one
UPDATE calendar_integrations 
SET is_active = false 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM calendar_integrations 
    WHERE is_active = true 
    ORDER BY user_id, created_at DESC
); 