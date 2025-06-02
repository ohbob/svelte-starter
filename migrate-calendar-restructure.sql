-- Migration: Restructure Calendar System
-- Move calendar integration from company-level to user-level
-- Create availability templates system

-- 1. Create new availability templates table
CREATE TABLE IF NOT EXISTS "availability_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Create availability slots table
CREATE TABLE IF NOT EXISTS "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 3. Add foreign key constraints
ALTER TABLE "availability_templates" ADD CONSTRAINT "availability_templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_template_id_availability_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "availability_templates"("id") ON DELETE cascade;

-- 4. Add availability template reference to meeting types
ALTER TABLE "meeting_types" ADD COLUMN IF NOT EXISTS "availability_template_id" uuid;
ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_availability_template_id_availability_templates_id_fk" FOREIGN KEY ("availability_template_id") REFERENCES "availability_templates"("id") ON DELETE set null;

-- 5. Create new user-level calendar integrations table
CREATE TABLE IF NOT EXISTS "calendar_integrations_new" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text DEFAULT 'google' NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"selected_calendar_id" text,
	"selected_calendar_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "calendar_integrations_new" ADD CONSTRAINT "calendar_integrations_new_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;

-- 6. Migrate existing calendar integrations from company-level to user-level
-- This assumes each company belongs to one user (which should be the case)
INSERT INTO "calendar_integrations_new" (
	"user_id",
	"provider", 
	"access_token",
	"refresh_token",
	"expires_at",
	"selected_calendar_id",
	"selected_calendar_name",
	"is_active",
	"created_at",
	"updated_at"
)
SELECT DISTINCT
	c."user_id",
	ci."provider",
	ci."access_token", 
	ci."refresh_token",
	ci."expires_at",
	ci."selected_calendar_id",
	ci."selected_calendar_name",
	ci."is_active",
	ci."created_at",
	ci."updated_at"
FROM "calendar_integrations" ci
JOIN "companies" c ON ci."company_id" = c."id"
WHERE ci."is_active" = true
ON CONFLICT DO NOTHING;

-- 7. Create default availability templates for each user based on existing company availability
INSERT INTO "availability_templates" ("user_id", "name", "description", "is_default", "is_active")
SELECT DISTINCT 
	c."user_id",
	'Default Work Hours',
	'Migrated from company availability',
	true,
	true
FROM "companies" c
WHERE EXISTS (
	SELECT 1 FROM "availability" a WHERE a."company_id" = c."id"
);

-- 8. Migrate availability slots from company availability to templates
INSERT INTO "availability_slots" ("template_id", "day_of_week", "start_time", "end_time", "is_active")
SELECT 
	at."id",
	a."day_of_week",
	a."start_time", 
	a."end_time",
	a."is_active"
FROM "availability" a
JOIN "companies" c ON a."company_id" = c."id"
JOIN "availability_templates" at ON at."user_id" = c."user_id" AND at."is_default" = true;

-- 9. Link meeting types to their default availability templates
UPDATE "meeting_types" 
SET "availability_template_id" = at."id"
FROM "companies" c
JOIN "availability_templates" at ON at."user_id" = c."user_id" AND at."is_default" = true
WHERE "meeting_types"."company_id" = c."id";

-- 10. Drop old calendar integrations table and rename new one
DROP TABLE IF EXISTS "calendar_integrations";
ALTER TABLE "calendar_integrations_new" RENAME TO "calendar_integrations";

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_availability_templates_user_id" ON "availability_templates"("user_id");
CREATE INDEX IF NOT EXISTS "idx_availability_slots_template_id" ON "availability_slots"("template_id");
CREATE INDEX IF NOT EXISTS "idx_meeting_types_availability_template_id" ON "meeting_types"("availability_template_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_integrations_user_id" ON "calendar_integrations"("user_id");

-- Note: The old "availability" table is kept for backward compatibility
-- It can be dropped after confirming the migration worked correctly 