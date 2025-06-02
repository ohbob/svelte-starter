-- Migration: Update calendar tables to use company_id instead of user_id
-- This migration assumes each user has at least one company

BEGIN;

-- Step 1: Add company_id columns to calendar tables
ALTER TABLE meeting_types ADD COLUMN company_id TEXT;
ALTER TABLE availability ADD COLUMN company_id TEXT;
ALTER TABLE calendar_integrations ADD COLUMN company_id TEXT;

-- Step 2: For each user, get their first company and update calendar records
-- Update meeting_types
UPDATE meeting_types 
SET company_id = (
    SELECT c.id 
    FROM companies c 
    WHERE c.user_id = meeting_types.user_id 
    LIMIT 1
)
WHERE company_id IS NULL;

-- Update availability
UPDATE availability 
SET company_id = (
    SELECT c.id 
    FROM companies c 
    WHERE c.user_id = availability.user_id 
    LIMIT 1
)
WHERE company_id IS NULL;

-- Update calendar_integrations
UPDATE calendar_integrations 
SET company_id = (
    SELECT c.id 
    FROM companies c 
    WHERE c.user_id = calendar_integrations.user_id 
    LIMIT 1
)
WHERE company_id IS NULL;

-- Step 3: Add foreign key constraints
ALTER TABLE meeting_types 
ADD CONSTRAINT meeting_types_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE availability 
ADD CONSTRAINT availability_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE calendar_integrations 
ADD CONSTRAINT calendar_integrations_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Step 4: Make company_id NOT NULL
ALTER TABLE meeting_types ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE availability ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE calendar_integrations ALTER COLUMN company_id SET NOT NULL;

-- Step 5: Drop old user_id columns and constraints
ALTER TABLE meeting_types DROP CONSTRAINT meeting_types_user_id_user_id_fk;
ALTER TABLE meeting_types DROP COLUMN user_id;

ALTER TABLE availability DROP CONSTRAINT availability_user_id_user_id_fk;
ALTER TABLE availability DROP COLUMN user_id;

ALTER TABLE calendar_integrations DROP CONSTRAINT calendar_integrations_user_id_user_id_fk;
ALTER TABLE calendar_integrations DROP COLUMN user_id;

COMMIT; 