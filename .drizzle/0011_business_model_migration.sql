-- Migration: Business Model Schema Restructure
-- This migration transitions from the old simple schema to the comprehensive business model

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS companies_backup AS SELECT * FROM companies;
CREATE TABLE IF NOT EXISTS services_backup AS SELECT * FROM services;

-- Step 2: Add new columns to existing tables first
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_colors JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_info JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_contact_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_contact_phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS preferences JSONB;

-- Update existing companies with slug if missing
UPDATE companies SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '.', '')) WHERE slug IS NULL;
UPDATE companies SET default_contact_email = email WHERE default_contact_email IS NULL AND email IS NOT NULL;
UPDATE companies SET default_contact_phone = phone WHERE default_contact_phone IS NULL AND phone IS NOT NULL;

-- Make slug NOT NULL and UNIQUE after populating
ALTER TABLE companies ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique ON companies(slug);

-- Step 3: Update services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_range JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Migrate data from old columns to new columns
UPDATE services SET 
    company_id = user_id,
    name = title,
    slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '.', '')),
    short_description = description,
    long_description = description
WHERE company_id IS NULL;

-- Make required columns NOT NULL
ALTER TABLE services ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN name SET NOT NULL;
ALTER TABLE services ALTER COLUMN slug SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE services ADD CONSTRAINT services_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- Step 4: Add user role and company relationship
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Step 5: Create new tables for the business model

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    address JSONB,
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    role TEXT,
    title TEXT,
    photo TEXT,
    bio TEXT,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Social links table
CREATE TABLE IF NOT EXISTS social_links (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    type TEXT NOT NULL CHECK (type IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'website', 'other')),
    url TEXT NOT NULL,
    label TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    client_name TEXT,
    text TEXT NOT NULL,
    rating INTEGER,
    date TIMESTAMP DEFAULT NOW(),
    show_on_website BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    cover_image TEXT,
    excerpt TEXT,
    body TEXT NOT NULL,
    tags JSONB,
    seo_title TEXT,
    seo_description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Legal documents table
CREATE TABLE IF NOT EXISTS legal_documents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    type TEXT NOT NULL CHECK (type IN ('privacy_policy', 'terms_of_service', 'cookie_policy', 'refund_policy', 'other')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    auto_generate BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Websites table
CREATE TABLE IF NOT EXISTS websites (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    theme TEXT DEFAULT 'default',
    color_scheme JSONB,
    navigation JSONB,
    seo_settings JSONB,
    preferences JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contact info table
CREATE TABLE IF NOT EXISTS contact_info (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    color TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Junction tables for many-to-many relationships
CREATE TABLE IF NOT EXISTS service_locations (
    service_id TEXT NOT NULL REFERENCES services(id),
    location_id TEXT NOT NULL REFERENCES locations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (service_id, location_id)
);

CREATE TABLE IF NOT EXISTS service_team_members (
    service_id TEXT NOT NULL REFERENCES services(id),
    team_member_id TEXT NOT NULL REFERENCES team_members(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (service_id, team_member_id)
);

CREATE TABLE IF NOT EXISTS team_member_locations (
    team_member_id TEXT NOT NULL REFERENCES team_members(id),
    location_id TEXT NOT NULL REFERENCES locations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (team_member_id, location_id)
);

CREATE TABLE IF NOT EXISTS contact_info_links (
    contact_info_id TEXT NOT NULL REFERENCES contact_info(id),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('location', 'team_member', 'company')),
    entity_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (contact_info_id, entity_type, entity_id)
);

-- Step 6: Clean up old columns (commented out for safety - uncomment after verifying migration)
-- ALTER TABLE companies DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE companies DROP COLUMN IF EXISTS tagline;
-- ALTER TABLE companies DROP COLUMN IF EXISTS description;
-- ALTER TABLE companies DROP COLUMN IF EXISTS email;
-- ALTER TABLE companies DROP COLUMN IF EXISTS phone;
-- ALTER TABLE companies DROP COLUMN IF EXISTS website;
-- ALTER TABLE companies DROP COLUMN IF EXISTS address;
-- ALTER TABLE companies DROP COLUMN IF EXISTS city;
-- ALTER TABLE companies DROP COLUMN IF EXISTS state;
-- ALTER TABLE companies DROP COLUMN IF EXISTS zip_code;
-- ALTER TABLE companies DROP COLUMN IF EXISTS country;
-- ALTER TABLE companies DROP COLUMN IF EXISTS timezone;
-- ALTER TABLE companies DROP COLUMN IF EXISTS business_hours;
-- ALTER TABLE companies DROP COLUMN IF EXISTS social_media;
-- ALTER TABLE companies DROP COLUMN IF EXISTS accepts_online_booking;
-- ALTER TABLE companies DROP COLUMN IF EXISTS requires_confirmation;
-- ALTER TABLE companies DROP COLUMN IF EXISTS cancellation_policy;
-- ALTER TABLE companies DROP COLUMN IF EXISTS payment_methods;
-- ALTER TABLE companies DROP COLUMN IF EXISTS languages;

-- ALTER TABLE services DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE services DROP COLUMN IF EXISTS title;
-- ALTER TABLE services DROP COLUMN IF EXISTS description; 