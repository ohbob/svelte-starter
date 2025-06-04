-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	company_id text NOT NULL,
	name text NOT NULL,
	type text NOT NULL,
	address text,
	city text,
	state text,
	country text,
	postal_code text,
	phone text,
	contact_person text,
	instructions text,
	platform text,
	auto_generate_link boolean DEFAULT false,
	custom_meeting_url text,
	meeting_instructions text,
	description text,
	is_active boolean DEFAULT true NOT NULL,
	is_default boolean DEFAULT false NOT NULL,
	metadata jsonb,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE locations ADD CONSTRAINT IF NOT EXISTS locations_company_id_companies_id_fk 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE cascade ON UPDATE no action;

-- Add location_id column to meeting_types (this will fail if it already exists, which is fine)
ALTER TABLE meeting_types ADD COLUMN location_id uuid;

-- Add foreign key constraint for meeting_types
ALTER TABLE meeting_types ADD CONSTRAINT IF NOT EXISTS meeting_types_location_id_locations_id_fk 
FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE restrict ON UPDATE no action; 