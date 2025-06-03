-- Migration: Add many-to-many relationship between meeting types and availability templates
-- Date: 2025-01-03

-- Create the junction table
CREATE TABLE IF NOT EXISTS "meeting_type_availability_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_type_id" uuid NOT NULL,
	"availability_template_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "meeting_type_availability_templates" ADD CONSTRAINT "meeting_type_availability_templates_meeting_type_id_meeting_types_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "meeting_types"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meeting_type_availability_templates" ADD CONSTRAINT "meeting_type_availability_templates_availability_template_id_availability_templates_id_fk" FOREIGN KEY ("availability_template_id") REFERENCES "availability_templates"("id") ON DELETE cascade ON UPDATE no action;

-- Migrate existing data from meeting_types.availability_template_id to the junction table
INSERT INTO "meeting_type_availability_templates" ("meeting_type_id", "availability_template_id")
SELECT "id", "availability_template_id" 
FROM "meeting_types" 
WHERE "availability_template_id" IS NOT NULL;

-- Drop the old column (commented out for safety - run manually after verifying migration)
-- ALTER TABLE "meeting_types" DROP COLUMN "availability_template_id";

-- Add unique constraint to prevent duplicate relationships
ALTER TABLE "meeting_type_availability_templates" ADD CONSTRAINT "meeting_type_availability_templates_unique" UNIQUE ("meeting_type_id", "availability_template_id"); 